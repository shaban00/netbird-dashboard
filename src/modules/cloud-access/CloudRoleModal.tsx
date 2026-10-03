import React, { useMemo, useState } from "react";
import Button from "@components/Button";
import { Callout } from "@components/Callout";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import Separator from "@components/Separator";
import useFetchApi, { useApiCall } from "@utils/api";
import { trim } from "lodash";
import {
  ClockIcon,
  ExternalLinkIcon,
  KeyIcon,
  SaveIcon,
  ShieldCheckIcon,
  TagIcon,
} from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  CloudAccess,
  CloudRole,
  CloudRoleRequest,
} from "@/interfaces/CloudAccess";
import {
  azureTokenLifetimeHelpText,
  azureTokenLifetimeReferenceLink,
  credentialLifetimeHelpText,
  credentialLifetimeMinutesBounds,
  credentialLifetimeReferenceLinks,
  gcpServiceAccountEmail,
  gcpServiceAccountEmailSuffix,
  parseAWSRoleARN,
  principalNameHelpText,
  principalNameInputPatterns,
  principalNameLabels,
  principalNameLockedHelpText,
  principalNamePlaceholders,
} from "@/modules/cloud-access/cloudProviderValidation";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (role: CloudRole) => void;
  onUpdated: (role: CloudRole) => void;
  access: CloudAccess;
  role?: CloudRole;
};

export default function CloudRoleModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  access,
  role,
}: Readonly<Props>) {
  const { permission } = usePermissions();
  const isEditing = !!role;
  const provider = access.provider;
  const isLocked = isEditing && role?.status === "connected";

  const createRequest = useApiCall<CloudRole>(
    `/cloud-access/${access.id}/roles`,
  );
  const updateRequest = useApiCall<CloudRole>(
    `/cloud-access/${access.id}/roles/${role?.id}`,
  );

  const [roleMode, setRoleMode] = useState<"create" | "import">("create");
  const isAWSImport = provider === "aws" && !isEditing && roleMode === "import";
  const isAzureCreate =
    provider === "azure" && !isEditing && roleMode === "create";

  const [arnInput, setArnInput] = useState("");
  const parsedArn = useMemo(() => parseAWSRoleARN(arnInput), [arnInput]);
  const arnError = useMemo(() => {
    if (!trim(arnInput)) return "";
    if (!parsedArn) return "Not a valid IAM role ARN.";
    if (access.provider_account_id && parsedArn.accountId !== access.provider_account_id) {
      return `This ARN belongs to a different AWS account (expected ${access.provider_account_id}).`;
    }
    return "";
  }, [arnInput, parsedArn, access.provider_account_id]);

  const credentialLifetimeBounds = credentialLifetimeMinutesBounds[provider];
  const [credentialLifetimeMinutes, setCredentialLifetimeMinutes] = useState(
    () =>
      role?.credential_lifetime_seconds
        ? String(Math.round(role.credential_lifetime_seconds / 60))
        : "",
  );
  const credentialLifetimeError = useMemo(() => {
    if (!credentialLifetimeBounds || trim(credentialLifetimeMinutes) === "")
      return "";
    const value = Number(credentialLifetimeMinutes);
    if (!Number.isInteger(value)) return "Must be a whole number of minutes.";
    if (value < credentialLifetimeBounds.min || value > credentialLifetimeBounds.max) {
      return `Must be between ${credentialLifetimeBounds.min} and ${credentialLifetimeBounds.max} minutes for this provider.`;
    }
    return "";
  }, [credentialLifetimeMinutes, credentialLifetimeBounds]);

  const [name, setName] = useState(role?.name ?? "");
  const gcpFullSuffix =
    provider === "gcp" && access.provider_project_id
      ? `@${access.provider_project_id}${gcpServiceAccountEmailSuffix}`
      : null;
  const [principalName, setPrincipalName] = useState(() => {
    const stored = role?.principal_name ?? "";
    return gcpFullSuffix && stored.endsWith(gcpFullSuffix)
      ? stored.slice(0, -gcpFullSuffix.length)
      : stored;
  });

  const { data: siblingRoles } = useFetchApi<CloudRole[]>(
    open ? `/cloud-access/${access.id}/roles` : "",
    true,
    true,
    open,
  );

  const nameError = useMemo(() => {
    const trimmed = trim(name).toLowerCase();
    if (!trimmed) return "";
    const clashes = siblingRoles?.some(
      (r) => r.id !== role?.id && trim(r.name).toLowerCase() === trimmed,
    );
    return clashes
      ? "A role with this name already exists. Please use another name."
      : "";
  }, [name, siblingRoles, role?.id]);

  const trimmedPrincipalName = trim(principalName);
  const effectivePrincipalName = isAWSImport
    ? (parsedArn?.roleName ?? "")
    : trimmedPrincipalName;
  const storedPrincipalName =
    provider === "gcp" && effectivePrincipalName && access.provider_project_id
      ? gcpServiceAccountEmail(effectivePrincipalName, access.provider_project_id)
      : effectivePrincipalName;

  const principalNameError = useMemo(() => {
    if (!effectivePrincipalName) return "";
    if (
      !isAWSImport &&
      !principalNameInputPatterns[provider].test(effectivePrincipalName)
    )
      return "";
    const trimmedStored = storedPrincipalName.toLowerCase();
    const clashes = siblingRoles?.some(
      (r) =>
        r.id !== role?.id &&
        trim(r.principal_name ?? "").toLowerCase() === trimmedStored,
    );
    return clashes
      ? `A role with this ${principalNameLabels[provider]} already exists. Please use another name.`
      : "";
  }, [
    effectivePrincipalName,
    isAWSImport,
    storedPrincipalName,
    siblingRoles,
    role?.id,
    provider,
  ]);

  const isDisabled = useMemo(() => {
    const trimmedName = trim(name);

    if (trimmedName.length === 0) return true;
    if (provider === "gcp" && !access.provider_project_id) return true;
    if (isAWSImport) {
      if (!parsedArn || arnError) return true;
    } else if (trimmedPrincipalName === "") {
      if (!isAzureCreate) return true;
    } else if (!principalNameInputPatterns[provider].test(trimmedPrincipalName)) {
      return true;
    }
    if (nameError || principalNameError || credentialLifetimeError) return true;

    return false;
  }, [
    name,
    isAWSImport,
    isAzureCreate,
    parsedArn,
    arnError,
    trimmedPrincipalName,
    nameError,
    principalNameError,
    credentialLifetimeError,
    provider,
    access.provider_project_id,
  ]);

  const previewRef =
    provider === "aws"
      ? access.provider_account_id && effectivePrincipalName
        ? `arn:aws:iam::${access.provider_account_id}:role/${effectivePrincipalName}`
        : null
      : provider === "gcp" && trimmedPrincipalName
        ? storedPrincipalName
        : null;

  const submit = () => {
    const payload: CloudRoleRequest = {
      name: trim(name),
      principal_name: storedPrincipalName,
    };
    if (!isEditing) {
      payload.setup_mode = roleMode;
    }
    
    if (credentialLifetimeBounds && trim(credentialLifetimeMinutes) !== "") {
      payload.credential_lifetime_seconds = Number(credentialLifetimeMinutes) * 60;
    }

    if (isEditing) {
      notify({
        title: "Update Cloud Role",
        description: "Cloud role was updated successfully.",
        promise: updateRequest.put(payload).then((updated) => {
          onUpdated(updated);
        }),
        loadingMessage: "Updating cloud role...",
      });
    } else {
      notify({
        title: "Create Cloud Role",
        description: "Cloud role was created. Run its deploy script next to connect it.",
        promise: createRequest.post(payload).then((created) => {
          onCreated(created);
        }),
        loadingMessage: "Creating cloud role...",
      });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(state) => !state && onClose()}
      key={open ? 1 : 0}
    >
      <ModalContent maxWidthClass={"max-w-xl"} className={"overflow-x-hidden"}>
        <ModalHeader
          icon={<ShieldCheckIcon size={20} />}
          title={isEditing ? "Edit Cloud Role" : "Add Cloud Role"}
          description={
            isEditing
              ? "Update this role"
              : "Configure a role for NetBird to federate into"
          }
          color={"netbird"}
        />

        <Separator />

        <div className={"px-8 py-6 flex flex-col gap-6"}>
          <div>
            <Label>Name</Label>
            <HelpText>A friendly name to identify this role</HelpText>
            <Input
              placeholder={"e.g., Developer"}
              value={name}
              error={nameError}
              onChange={(e) => setName(e.target.value)}
              customPrefix={<TagIcon size={16} className="text-nb-gray-300" />}
            />
          </div>

          {!isEditing && (
            <div>
              <Label>Role setup</Label>
              <Select
                value={roleMode}
                onValueChange={(value) =>
                  setRoleMode(value as "create" | "import")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {provider === "aws" ? (
                    <>
                      <SelectItem value={"create"}>
                        Create a new role
                      </SelectItem>
                      <SelectItem value={"import"}>
                        Import an existing role
                      </SelectItem>
                    </>
                  ) : provider === "azure" ? (
                    <>
                      <SelectItem value={"create"}>
                        Create a new App Registration
                      </SelectItem>
                      <SelectItem value={"import"}>
                        Import an existing App Registration
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value={"create"}>
                        Create a new service account
                      </SelectItem>
                      <SelectItem value={"import"}>
                        Import an existing service account
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {isAWSImport ? (
            <div>
              <Label>Existing Role ARN</Label>
              <HelpText>
                Paste the ARN of an IAM role you&apos;ve already created.
              </HelpText>
              <Input
                placeholder={"arn:aws:iam::123456789012:role/MyExistingRole"}
                value={arnInput}
                error={arnError}
                onChange={(e) => setArnInput(e.target.value)}
                customPrefix={
                  <KeyIcon size={16} className="text-nb-gray-300" />
                }
              />
              {previewRef && (
                <HelpText className={"font-mono mt-2 break-all"}>
                  {previewRef}
                </HelpText>
              )}
            </div>
          ) : isAzureCreate ? (
            <HelpText margin={false}>
              You&apos;ll set the Application (Client) ID after running the deploy script
            </HelpText>
          ) : (
            <div>
              <Label>{principalNameLabels[provider]}</Label>
              <HelpText>
                {provider === "gcp" && !access.provider_project_id
                  ? "This connection is missing its GCP Project ID — edit the connection to add one before adding a role."
                  : isLocked
                    ? principalNameLockedHelpText[provider]
                    : principalNameHelpText[provider]}
              </HelpText>
              <Input
                placeholder={principalNamePlaceholders[provider]}
                value={principalName}
                error={principalNameError}
                onChange={(e) => setPrincipalName(e.target.value)}
                disabled={isLocked || (provider === "gcp" && !access.provider_project_id)}
                customPrefix={
                  <KeyIcon size={16} className="text-nb-gray-300" />
                }
              />
              {previewRef && (
                <HelpText className={"font-mono mt-2 break-all"}>
                  {previewRef}
                </HelpText>
              )}
            </div>
          )}

          {credentialLifetimeBounds && (
            <div>
              <Label>Credential Lifetime (minutes)</Label>
              <Input
                type={"number"}
                min={credentialLifetimeBounds.min}
                max={credentialLifetimeBounds.max}
                placeholder={`${credentialLifetimeBounds.min}–${credentialLifetimeBounds.max} (default: ${credentialLifetimeBounds.min})`}
                value={credentialLifetimeMinutes}
                error={credentialLifetimeError}
                onChange={(e) => setCredentialLifetimeMinutes(e.target.value)}
                customPrefix={
                  <ClockIcon size={16} className="text-nb-gray-300" />
                }
              />
              <Callout variant={"info"} className={"mt-2"}>
                {credentialLifetimeHelpText[provider]}{" "}
                {credentialLifetimeReferenceLinks[provider] && (
                  <InlineLink
                    href={credentialLifetimeReferenceLinks[provider]}
                    target={"_blank"}
                  >
                    Learn more
                    <ExternalLinkIcon size={10} />
                  </InlineLink>
                )}
              </Callout>
            </div>
          )}

          {provider === "azure" && (
            <Callout variant={"info"}>
              {azureTokenLifetimeHelpText}{" "}
              <InlineLink href={azureTokenLifetimeReferenceLink} target={"_blank"}>
                Learn more
                <ExternalLinkIcon size={10} />
              </InlineLink>
            </Callout>
          )}
        </div>

        <ModalFooter className={"items-center"}>
          <div className={"flex gap-3 w-full justify-end"}>
            <ModalClose asChild={true}>
              <Button variant={"secondary"}>Cancel</Button>
            </ModalClose>

            <Button
              variant={"primary"}
              onClick={submit}
              disabled={
                isDisabled ||
                (isEditing
                  ? !permission.cloud_access.update
                  : !permission.cloud_access.create)
              }
            >
              {isEditing ? (
                <>
                  <SaveIcon size={16} />
                  Save Changes
                </>
              ) : (
                <>
                  <ShieldCheckIcon size={16} />
                  Add Role
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
