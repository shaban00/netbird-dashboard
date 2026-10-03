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
import { EyeIcon, MoreVertical, PencilLineIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { CloudAccess, CloudRole } from "@/interfaces/CloudAccess";
import { useCloudAccessContext } from "@/modules/cloud-access/CloudAccessProvider";

type Props = {
  access: CloudAccess;
};

export default function CloudAccessActionCell({ access }: Readonly<Props>) {
  const { permission } = usePermissions();
  const { deleteCloudAccess, openEditAccessModal } = useCloudAccessContext();
  const router = useRouter();

  const { data: roles } = useFetchApi<CloudRole[]>(
    `/cloud-access/${access.id}/roles`,
    true,
  );
  const hasRoles = (roles?.length ?? 0) > 0;

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
            data-testid="cloud-access-actions"
          >
            <MoreVertical size={16} className={"shrink-0"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto" align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/cloud-access-detail?id=${access.id}`)}
            data-testid="view-cloud-access-details"
          >
            <div className={"flex gap-3 items-center"}>
              <EyeIcon size={14} className={"shrink-0"} />
              View
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openEditAccessModal(access)}
            disabled={!permission.cloud_access.update}
            data-testid="rename-cloud-access"
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
                This connection has roles configured under it. Delete them first before deleting the connection.
              </div>
            }
            interactive={false}
            disabled={!hasRoles}
            className={"w-full block"}
          >
            <DropdownMenuItem
              onClick={() => deleteCloudAccess(access)}
              variant={"danger"}
              disabled={hasRoles || !permission.cloud_access.delete}
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
