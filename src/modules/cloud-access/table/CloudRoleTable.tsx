import React from "react";
import Button from "@components/Button";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import GetStartedTest from "@components/ui/GetStartedTest";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { cn } from "@utils/helpers";
import { PlusCircle, ShieldCheckIcon } from "lucide-react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CloudAccess, CloudRole } from "@/interfaces/CloudAccess";
import { useCloudAccessContext } from "@/modules/cloud-access/CloudAccessProvider";
import CloudRoleStatusBadge from "@/modules/cloud-access/CloudRoleStatusBadge";
import CloudRoleActionCell from "@/modules/cloud-access/table/CloudRoleActionCell";
import ValidateAllRolesButton from "@/modules/cloud-access/table/ValidateAllRolesButton";

type Props = {
  access: CloudAccess;
  data?: CloudRole[];
  isLoading: boolean;
};

export default function CloudRoleTable({
  access,
  data,
  isLoading,
}: Readonly<Props>) {
  const { mutate } = useSWRConfig();
  const { openRoleModal } = useCloudAccessContext();

  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort-cloud-roles-" + access.id,
    [{ id: "name", desc: false }],
  );

  const columns: ColumnDef<CloudRole>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableHeader column={column}>Role</DataTableHeader>
      ),
      sortingFn: "text",
      cell: ({ row }) => (
        <div className={"flex items-center gap-3"}>
          <ShieldCheckIcon size={16} className={"text-nb-gray-400 shrink-0"} />
          <span className={"font-medium"}>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "principal_ref",
      header: ({ column }) => (
        <DataTableHeader column={column}>Principal</DataTableHeader>
      ),
      cell: ({ row }) => (
        <span className={"text-nb-gray-400 font-mono text-xs"}>
          {row.original.principal_ref}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableHeader column={column}>Status</DataTableHeader>
      ),
      cell: ({ row }) => <CloudRoleStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "id",
      header: "",
      cell: ({ row }) => (
        <CloudRoleActionCell access={access} role={row.original} />
      ),
    },
  ];

  return (
    <DataTable
      isLoading={isLoading}
      text={"Roles"}
      sorting={sorting}
      setSorting={setSorting}
      columns={columns}
      data={data}
      initialPageSize={25}
      showResetFilterButton={false}
      searchPlaceholder={"Search by role name..."}
      onRowClick={(row) => openRoleModal(access, row.original)}
      getStartedCard={
        <GetStartedTest
          icon={
            <SquareIcon
              icon={<ShieldCheckIcon className={"fill-nb-gray-200"} size={20} />}
              color={"gray"}
              size={"large"}
            />
          }
          title={"No roles added yet"}
          description={
            access.provider === "gcp"
              ? "Add a service account NetBird can federate into within this GCP project, then reference it as a policy destination."
              : access.provider === "azure"
                ? "Add an App Registration NetBird can federate into within this Azure AD tenant, then reference it as a policy destination."
                : "Add an IAM role for NetBird to federate into."
          }
          button={
            <div className={"gap-x-4 flex items-center justify-center"}>
              <AddRoleButton access={access} />
            </div>
          }
        />
      }
      rightSide={() =>
        data &&
        data.length > 0 && (
          <div className={cn("gap-x-4 ml-auto flex")}>
            <AddRoleButton access={access} />
          </div>
        )
      }
    >
      {() => (
        <>
          <DataTableRefreshButton
            isDisabled={data?.length == 0}
            onClick={() => {
              mutate(`/cloud-access/${access.id}/roles`).then();
            }}
          />
          <ValidateAllRolesButton access={access} roles={data} />
        </>
      )}
    </DataTable>
  );
}

const AddRoleButton = ({ access }: { access: CloudAccess }) => {
  const { permission } = usePermissions();
  const { openRoleModal } = useCloudAccessContext();

  return (
    <Button
      variant={"primary"}
      onClick={() => openRoleModal(access)}
      disabled={!permission.cloud_access.create}
      data-testid={"add-cloud-role"}
    >
      <PlusCircle size={16} />
      Add Role
    </Button>
  );
};
