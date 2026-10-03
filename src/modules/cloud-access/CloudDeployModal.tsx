import React, { useState } from "react";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Modal, ModalContent } from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
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
import { CloudIcon, KeyIcon } from "lucide-react";
import {
  CloudAccess,
  CloudDeployStepsResponse,
  CloudProviderName,
  CloudRole,
} from "@/interfaces/CloudAccess";
import { principalNameInputPatterns } from "@/modules/cloud-access/cloudProviderValidation";
import CloudRoleStatusBadge from "@/modules/cloud-access/CloudRoleStatusBadge";
import CommandStepper from "@/modules/cloud-access/CommandStepper";
import { useCloudRoleValidate } from "@/modules/cloud-access/useCloudRoleValidate";

type Mode = "create" | "import";

type Props = {
  open: boolean;
  onClose: () => void;
  access: CloudAccess;
  role: CloudRole;
  onValidated?: () => void;
};

const deployCopy: Record<
  CloudProviderName,
  {
    scriptPathSegment: string;
    title: string;
    description: Record<Mode, string>;
    createLabel: string;
    importLabel: string;
  }
> = {
  aws: {
    scriptPathSegment: "aws-deploy-script",
    title: "Deploy AWS Role",
    description: {
      create: "Run this AWS CLI command to create the IAM role this cloud role needs",
      import: "Run this AWS CLI command to add a trust statement to your existing role",
    },
    createLabel: "Create a new role",
    importLabel: "This role already exists",
  },
  gcp: {
    scriptPathSegment: "gcp-deploy-script",
    title: "Deploy GCP Role",
    description: {
      create: "Run this gcloud command to create the service account this cloud role needs",
      import: "Run this gcloud command to bind your existing service account",
    },
    createLabel: "Create a new service account",
    importLabel: "This service account already exists",
  },
  azure: {
    scriptPathSegment: "azure-deploy-script",
    title: "Deploy Azure Role",
    description: {
      create: "Run this az CLI command to create the App Registration this cloud role needs",
      import: "Run this az CLI command to add a Federated Credential to your existing App Registration",
    },
    createLabel: "Create a new App Registration",
    importLabel: "This App Registration already exists",
  },
};

export default function CloudDeployModal({
  open,
  onClose,
  access,
  role,
  onValidated,
}: Readonly<Props>) {
  const copy = deployCopy[access.provider];
  const knownMode = role.setup_mode;
  const [mode, setMode] = useState<Mode>(knownMode ?? "import");
  const modeIsKnown = knownMode !== undefined;

  const scriptPath = open
    ? `/cloud-access/${access.id}/roles/${role.id}/${copy.scriptPathSegment}?mode=${mode}`
    : "";

  const {
    data: script,
    error: scriptError,
    isLoading,
  } = useFetchApi<CloudDeployStepsResponse>(scriptPath, true, true, open);

  const needsClientId = access.provider === "azure" && !role.principal_name;
  const [clientId, setClientId] = useState("");
  const trimmedClientId = trim(clientId);
  const clientIdValid = principalNameInputPatterns.azure.test(trimmedClientId);

  const updateRoleRequest = useApiCall<CloudRole>(
    `/cloud-access/${access.id}/roles/${role.id}`,
  );

  const validate = useCloudRoleValidate(
    access,
    role,
    onValidated,
    onClose,
    needsClientId
      ? () =>
          updateRoleRequest
            .put({ name: role.name, principal_name: trimmedClientId })
            .then(() => undefined)
      : undefined,
  );

  return (
    <Modal
      open={open}
      onOpenChange={(state) => !state && onClose()}
      key={open ? 1 : 0}
    >
      <ModalContent
        maxWidthClass={"max-w-2xl"}
        className={"overflow-x-hidden"}
      >
        <ModalHeader
          icon={<CloudIcon size={20} />}
          title={`${copy.title} — ${role.name}`}
          description={copy.description[mode]}
          color={"netbird"}
        />

        <Separator />

        <div className={"px-8 pt-6 flex flex-col gap-5"}>
          <div className={"flex items-center justify-between"}>
            <Label>Status</Label>
            <CloudRoleStatusBadge status={role.status} />
          </div>

          {!modeIsKnown && (
            <div>
              <Label>Role setup</Label>
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as Mode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={"create"}>{copy.createLabel}</SelectItem>
                  <SelectItem value={"import"}>{copy.importLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <HelpText margin={false} className={"px-8 pt-6 pb-6"}>
            Preparing commands...
          </HelpText>
        ) : scriptError ? (
          <HelpText margin={false} className={"px-8 pt-6 pb-6 text-red-400"}>
            {scriptError.message || "Failed to load the deploy commands."}
          </HelpText>
        ) : script ? (
      
          <CommandStepper
            key={mode}
            steps={script.steps}
            onValidate={validate}
            validateDisabled={needsClientId && !clientIdValid}
          >
            {needsClientId && (
              <div>
                <Label>Application (Client) ID</Label>
                <HelpText>
                  Paste the Application (Client) ID the command above
                  printed, then click Validate.
                </HelpText>
                <Input
                  placeholder={"3b1e0c8f-4d2a-4b9e-9c7a-1f2e3d4c5b6a"}
                  value={clientId}
                  error={
                    trimmedClientId !== "" && !clientIdValid
                      ? "Not a valid Application (Client) ID."
                      : ""
                  }
                  onChange={(e) => setClientId(e.target.value)}
                  customPrefix={
                    <KeyIcon size={16} className="text-nb-gray-300" />
                  }
                />
              </div>
            )}
          </CommandStepper>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
