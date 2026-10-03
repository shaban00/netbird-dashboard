import * as React from "react";
import Button from "@components/Button";
import { notify } from "@components/Notification";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/Tooltip";
import { useApiCall } from "@utils/api";
import { motion } from "framer-motion";
import { ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { CloudAccess, CloudRole } from "@/interfaces/CloudAccess";

type Props = {
  access: CloudAccess;
  roles?: CloudRole[];
};

export default function ValidateAllRolesButton({
  access,
  roles,
}: Readonly<Props>) {
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const validateRequest = useApiCall<CloudRole>(
    `/cloud-access/${access.id}/roles`,
  );

  const [rotate, setRotate] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isDisabled = !roles || roles.length === 0;

  const triggerValidateAll = () => {
    setDisabled(true);
    setRotate(!rotate);

    const promise = Promise.allSettled(
      (roles ?? []).map((role) =>
        validateRequest.post({}, `/${role.id}/validate`),
      ),
    ).then(() => {
      mutate(`/cloud-access/${access.id}/roles`);
      mutate("/cloud-roles");
      mutate("/cloud-access");
      mutate(`/cloud-access/${access.id}`);
    });

    notify({
      title: "Validate All Roles",
      description:
        "Re-checked the trust relationship for every role — see the updated statuses below.",
      promise,
      loadingMessage: "Validating all roles...",
    });

    setTimeout(() => setDisabled(false), 5000);
  };

  return (
    <Tooltip delayDuration={1}>
      <TooltipTrigger
        asChild={true}
        onMouseOver={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.preventDefault();
          !isDisabled && !disabled && triggerValidateAll();
        }}
      >
        <Button
          className={"h-[42px]"}
          variant={"secondary"}
          disabled={isDisabled || disabled || !permission.cloud_access.update}
          data-testid={"validate-all-roles"}
        >
          <motion.div
            key={rotate ? "rotate" : "no-rotate"}
            animate={{ rotate: -360 }}
            transition={{ duration: 0.8 }}
          >
            <ShieldCheckIcon size={16} />
          </motion.div>
        </Button>
      </TooltipTrigger>

      <TooltipContent
        sideOffset={10}
        className={"px-3 py-2"}
        onPointerDownOutside={(event) => {
          if (hovered) event.preventDefault();
        }}
      >
        <span className={"text-xs text-neutral-300"}>
          {disabled
            ? "You can validate again in 5 seconds"
            : "Validate all roles"}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
