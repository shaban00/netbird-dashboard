import React, { useMemo, useState } from "react";
import Button from "@components/Button";
import HelpText from "@components/HelpText";
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
import { useApiCall } from "@utils/api";
import { trim } from "lodash";
import { CloudIcon, IdCard, SaveIcon, TagIcon } from "lucide-react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  CloudAccess,
  CloudAccessRequest,
  cloudProviderCatalog,
  CloudProviderName,
} from "@/interfaces/CloudAccess";
import CloudProviderIcon from "@/modules/cloud-access/CloudProviderIcon";
import {
  accountIdHelpText,
  accountIdLabels,
  accountIdPatterns,
  accountIdPlaceholders,
  gcpProjectIdHelpText,
  gcpProjectIdLabel,
  gcpProjectIdPattern,
  gcpProjectIdPlaceholder,
  providerArticles,
} from "@/modules/cloud-access/cloudProviderValidation";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (access: CloudAccess) => void;
  access?: CloudAccess;
};

export default function CloudAccessModal({
  open,
  onClose,
  onCreated,
  access,
}: Readonly<Props>) {
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const isEditing = !!access;
  const isLocked = isEditing && access?.status === "connected";

  const createRequest = useApiCall<CloudAccess>("/cloud-access");
  const updateRequest = useApiCall<CloudAccess>(
    "/cloud-access/" + access?.id,
  );

  const [providerName, setProviderName] = useState<CloudProviderName>(
    access?.provider ?? "aws",
  );
  const providerLabel =
    cloudProviderCatalog.find((entry) => entry.id === providerName)?.label ??
    "cloud";
  const [name, setName] = useState(access?.name ?? "");
  const [accountId, setAccountId] = useState(
    access?.provider_account_id ?? "",
  );
  const [projectId, setProjectId] = useState(
    access?.provider_project_id ?? "",
  );

  const isDisabled = useMemo(() => {
    const trimmedName = trim(name);
    const trimmedAccountId = trim(accountId);

    if (trimmedName.length === 0) return true;
    if (!accountIdPatterns[providerName].test(trimmedAccountId)) return true;
    if (providerName === "gcp" && !gcpProjectIdPattern.test(trim(projectId)))
      return true;

    return false;
  }, [name, accountId, projectId, providerName]);

  const submit = () => {
    const payload: CloudAccessRequest = {
      provider: providerName,
      name: trim(name),
      provider_account_id: trim(accountId),
    };
    if (providerName === "gcp") {
      payload.provider_project_id = trim(projectId);
    }

    if (isEditing && access) {
      notify({
        title: "Update Cloud Access",
        description: "Cloud access connection was updated successfully.",
        promise: updateRequest.put(payload).then(() => {
          mutate("/cloud-access");
          mutate(`/cloud-access/${access.id}`);
          onClose();
        }),
        loadingMessage: "Updating cloud access connection...",
      });
    } else {
      notify({
        title: "Create Cloud Access",
        description:
          "Cloud access connection was created. Add a role, then run its deploy script next to connect it.",
        promise: createRequest.post(payload).then((created) => {
          onCreated(created);
        }),
        loadingMessage: "Creating cloud access connection...",
      });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(state) => !state && onClose()}
      key={open ? 1 : 0}
    >
      <ModalContent maxWidthClass={"max-w-xl"}>
        <ModalHeader
          icon={<CloudIcon size={20} />}
          title={isEditing ? "Edit Cloud Access" : "Add Cloud Access"}
          description={
            isEditing
              ? "Update the cloud account connection"
              : `Connect ${providerArticles[providerName]} ${providerLabel} account so you can add roles NetBird policy can authorize federated access to`
          }
          color={"netbird"}
        />

        <Separator />

        <div className={"px-8 py-6 flex flex-col gap-6"}>
          <div>
            <Label>Provider</Label>
            <Select
              value={providerName}
              onValueChange={(value) =>
                setProviderName(value as CloudProviderName)
              }
              disabled={isLocked}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent>
                {cloudProviderCatalog.map((entry) => (
                  <SelectItem
                    key={entry.id}
                    value={entry.id}
                    disabled={!entry.enabled}
                    icon={<CloudProviderIcon provider={entry.id} />}
                  >
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Name</Label>
            <HelpText>A friendly name to identify this connection</HelpText>
            <Input
              placeholder={`e.g., Production ${providerLabel}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              customPrefix={<TagIcon size={16} className="text-nb-gray-300" />}
            />
          </div>

          <div>
            <Label>{accountIdLabels[providerName]}</Label>
            <HelpText>
              {isLocked
                ? "The trust relationship is already tied to this account."
                : accountIdHelpText[providerName]}
            </HelpText>
            <Input
              placeholder={accountIdPlaceholders[providerName]}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={isLocked}
              customPrefix={<IdCard size={16} className="text-nb-gray-300" />}
            />
          </div>

          {providerName === "gcp" && (
            <div>
              <Label>{gcpProjectIdLabel}</Label>
              <HelpText>
                {isLocked
                  ? "Every role's service account email is already built from this project."
                  : gcpProjectIdHelpText}
              </HelpText>
              <Input
                placeholder={gcpProjectIdPlaceholder}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isLocked}
                customPrefix={
                  <IdCard size={16} className="text-nb-gray-300" />
                }
              />
            </div>
          )}

          <HelpText margin={false}>
            Once connected, add roles. Each is configured and authorized separately.
          </HelpText>
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
                  <CloudIcon size={16} />
                  Add Provider
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
