"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import Card from "@components/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import FullTooltip from "@components/FullTooltip";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useRedirect from "@hooks/useRedirect";
import useFetchApi from "@utils/api";
import { singularize } from "@utils/helpers";
import {
  CloudIcon,
  IdCardIcon,
  MoreVertical,
  PencilLineIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import CircleIcon from "@/assets/icons/CircleIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  CloudAccess,
  cloudProviderNameLabels,
  CloudRole,
  CloudRoleStatus,
} from "@/interfaces/CloudAccess";
import PageContainer from "@/layouts/PageContainer";
import {
  CloudAccessProvider,
  useCloudAccessContext,
} from "@/modules/cloud-access/CloudAccessProvider";
import CloudRoleTable from "@/modules/cloud-access/table/CloudRoleTable";

export default function CloudAccessDetailPage() {
  const queryParameter = useSearchParams();
  const accessId = queryParameter.get("id");
  const { data: access, isLoading } = useFetchApi<CloudAccess>(
    `/cloud-access/${accessId}`,
    true,
  );

  useRedirect("/cloud-access", false, !accessId);

  return access && !isLoading ? (
    <CloudAccessProvider>
      <CloudAccessOverview access={access} />
    </CloudAccessProvider>
  ) : (
    <PageContainer>
      <SkeletonTable />
    </PageContainer>
  );
}

function CloudAccessOverview({
  access,
}: Readonly<{ access: CloudAccess }>) {
  const { permission } = usePermissions();
  const { data: roles, isLoading: isRolesLoading } = useFetchApi<CloudRole[]>(
    `/cloud-access/${access.id}/roles`,
  );

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/cloud-access"}
            label={"Cloud Access"}
            disabled={!permission.cloud_access.read}
            icon={<CloudIcon size={13} />}
          />
          <Breadcrumbs.Item label={access.name} active={true} />
        </Breadcrumbs>

        <div className={"flex justify-between max-w-6xl"}>
          <div className={"w-full lg:w-1/2 flex justify-between items-center"}>
            <div className={"flex items-center gap-2 w-full"}>
              <h1>{access.name}</h1>
            </div>
            <CloudAccessActions access={access} hasRoles={(roles?.length ?? 0) > 0} />
          </div>
        </div>

        <div className={"flex gap-10 w-full mt-8 max-w-6xl items-start"}>
          <CloudAccessInformationCard access={access} roles={roles ?? []} />
        </div>
      </div>

      <RestrictedAccess
        hasAccess={permission.cloud_access.read}
        page={"Cloud Access"}
      >
        <div className={"px-8 pb-8"}>
          <CloudRoleTable
            access={access}
            data={roles}
            isLoading={isRolesLoading}
          />
        </div>
      </RestrictedAccess>
    </PageContainer>
  );
}

function CloudAccessActions({
  access,
  hasRoles,
}: Readonly<{ access: CloudAccess; hasRoles: boolean }>) {
  const { permission } = usePermissions();
  const { deleteCloudAccess, openEditAccessModal } = useCloudAccessContext();
  const router = useRouter();

  return (
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
          data-testid="cloud-access-detail-actions"
        >
          <MoreVertical size={16} className={"shrink-0"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto" align="end">
        <DropdownMenuItem
          onClick={() => openEditAccessModal(access)}
          disabled={!permission.cloud_access.update}
          data-testid="rename-cloud-access"
        >
          <div className={"flex gap-3 items-center"}>
            <PencilLineIcon size={14} className={"shrink-0"} />
            Rename
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
            onClick={() =>
              deleteCloudAccess(access).then(() => router.push("/cloud-access"))
            }
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
  );
}

const ROLE_STATUS_ORDER: CloudRoleStatus[] = ["connected", "pending", "error"];

const roleStatusIcon: Record<CloudRoleStatus, React.ReactNode> = {
  connected: <ShieldCheckIcon size={16} className={"text-green-500"} />,
  pending: <ShieldAlertIcon size={16} className={"text-yellow-500"} />,
  error: <ShieldXIcon size={16} className={"text-red-500"} />,
};

const roleStatusShortLabel: Record<CloudRoleStatus, string> = {
  connected: "Connected",
  pending: "Pending",
  error: "Error",
};

function CloudAccessInformationCard({
  access,
  roles,
}: Readonly<{ access: CloudAccess; roles: CloudRole[] }>) {
  return (
    <Card className={"w-full lg:w-1/2"}>
      <Card.List>
        <Card.ListItem
          tooltip={false}
          label={
            <>
              <IdCardIcon size={16} />
              Account
            </>
          }
          value={
            <span className={"font-mono text-nb-gray-300"}>
              {access.provider_account_id}
            </span>
          }
        />
        <Card.ListItem
          tooltip={false}
          label={
            <>
              <CloudIcon size={16} />
              Provider
            </>
          }
          value={
            <span className={"text-nb-gray-300"}>
              {cloudProviderNameLabels[access.provider]}
            </span>
          }
        />
        {roles.length === 0 ? (
          <Card.ListItem
            tooltip={false}
            label={
              <>
                <ShieldXIcon size={16} className={"text-red-500"} />
                No Roles Yet
              </>
            }
            value={null}
          />
        ) : (
          ROLE_STATUS_ORDER.map((status) => ({
            status,
            count: roles.filter((r) => r.status === status).length,
          }))
            .filter(({ count }) => count > 0)
            .map(({ status, count }) => (
              <Card.ListItem
                key={status}
                tooltip={false}
                label={
                  <>
                    {roleStatusIcon[status]}
                    {singularize("Roles", count, true)}
                  </>
                }
                value={
                  <div className={"flex items-center gap-2"}>
                    <CircleIcon
                      active={status === "connected"}
                      inactiveDot={status === "error" ? "red" : "yellow"}
                      size={8}
                    />
                    <span className={"text-nb-gray-300"}>
                      {roleStatusShortLabel[status]}
                    </span>
                  </div>
                }
              />
            ))
        )}
      </Card.List>
    </Card>
  );
}
