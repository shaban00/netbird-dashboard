import * as React from "react";
import Button from "@components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import FullTooltip from "@components/FullTooltip";
import useFetchApi from "@utils/api";
import {
  MoreVertical,
  PencilLineIcon,
  ShieldCheckIcon,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { CloudAccess, CloudRole } from "@/interfaces/CloudAccess";
import { Policy } from "@/interfaces/Policy";
import { useCloudAccessContext } from "@/modules/cloud-access/CloudAccessProvider";

type Props = {
  access: CloudAccess;
  role: CloudRole;
};

export default function CloudRoleActionCell({
  access,
  role,
}: Readonly<Props>) {
  const { permission } = usePermissions();
  const { deleteRole, openRoleModal, openDeployRoleModal } =
    useCloudAccessContext();

  const { data: policies } = useFetchApi<Policy[]>("/policies");
  const usedByPolicy = useMemo(() => {
    return (policies || []).some((policy) =>
      policy.rules?.some(
        (rule) =>
          rule.destinationResource?.type === "cloud_integration" &&
          rule.destinationResource?.id === role.id,
      ),
    );
  }, [policies, role.id]);

  const isConnected = role.status === "connected";

  return (
    <div className={"flex justify-end pr-4"}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          asChild={true}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Button
            variant={"secondary"}
            className={"!px-3"}
            data-testid="cloud-role-actions"
          >
            <MoreVertical size={16} className={"shrink-0"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto" align="end">
          {!isConnected && (
            <DropdownMenuItem
              onClick={() => openDeployRoleModal(access, role)}
              disabled={!permission.cloud_access.update}
            >
              <div className={"flex gap-3 items-center"}>
                <ShieldCheckIcon size={14} className={"shrink-0"} />
                Validate
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => openRoleModal(access, role)}
            disabled={!permission.cloud_access.update}
            data-testid="rename-cloud-role"
          >
            <div className={"flex gap-3 items-center"}>
              <PencilLineIcon size={14} className={"shrink-0"} />
              Edit
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <FullTooltip
            content={
              <div className={"text-xs max-w-xs"}>
                This role is used by a policy. Detach it from any policy before deleting it.
              </div>
            }
            interactive={false}
            disabled={!usedByPolicy}
            className={"w-full block"}
          >
            <DropdownMenuItem
              onClick={() => deleteRole(access, role)}
              variant={"danger"}
              disabled={usedByPolicy || !permission.cloud_access.delete}
            >
              <div className={"flex gap-3 items-center"}>
                <Trash2 size={14} className={"shrink-0"} />
                Delete
              </div>
            </DropdownMenuItem>
          </FullTooltip>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
