import React, { useState } from "react";
import Button from "@components/Button";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import GetStartedTest from "@components/ui/GetStartedTest";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { cn } from "@utils/helpers";
import { CloudIcon, PlusCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CloudAccess, cloudProviderNameLabels } from "@/interfaces/CloudAccess";
import { useCloudAccessContext } from "@/modules/cloud-access/CloudAccessProvider";
import { CloudAccessSearchModal } from "@/modules/cloud-access/CloudAccessSearchModal";
import CloudAccessStatusBadge from "@/modules/cloud-access/CloudAccessStatusBadge";
import CloudAccessActionCell from "@/modules/cloud-access/table/CloudAccessActionCell";

export const CloudAccessTableColumns: ColumnDef<CloudAccess>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableHeader column={column}>Name</DataTableHeader>
    ),
    sortingFn: "text",
    cell: ({ row }) => (
      <div className={"flex items-center gap-3"}>
        <CloudIcon size={16} className={"text-nb-gray-400 shrink-0"} />
        <span className={"font-medium"}>{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "provider",
    header: ({ column }) => (
      <DataTableHeader column={column}>Provider</DataTableHeader>
    ),
    cell: ({ row }) => (
      <span className={"text-nb-gray-400"}>
        {cloudProviderNameLabels[row.original.provider]}
      </span>
    ),
  },
  {
    accessorKey: "provider_account_id",
    header: ({ column }) => (
      <DataTableHeader column={column}>Account</DataTableHeader>
    ),
    cell: ({ row }) => (
      <span className={"text-nb-gray-400"}>
        {row.original.provider_account_id}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableHeader column={column}>Status</DataTableHeader>
    ),
    cell: ({ row }) => <CloudAccessStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) => <CloudAccessActionCell access={row.original} />,
  },
];

type Props = {
  data?: CloudAccess[];
  isLoading: boolean;
  headingTarget?: HTMLHeadingElement | null;
};

export default function CloudAccessTable({
  isLoading,
  data,
  headingTarget,
}: Readonly<Props>) {
  const { mutate } = useSWRConfig();
  const path = usePathname();
  const router = useRouter();
  const [searchModal, setSearchModal] = useState(false);

  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [{ id: "name", desc: false }],
  );

  return (
    <>
      <CloudAccessSearchModal open={searchModal} setOpen={setSearchModal} />
      <DataTable
        headingTarget={headingTarget}
        isLoading={isLoading}
        text={"Cloud Access"}
        sorting={sorting}
        setSorting={setSorting}
        columns={CloudAccessTableColumns}
        data={data}
        initialPageSize={25}
        showResetFilterButton={false}
        searchPlaceholder={"Search by name, provider, or account..."}
        onSearchClick={() => setSearchModal(true)}
        onRowClick={(row) =>
          router.push(`/cloud-access-detail?id=${row.original.id}`)
        }
        getStartedCard={
          <GetStartedTest
            icon={
              <SquareIcon
                icon={<CloudIcon className={"fill-nb-gray-200"} size={20} />}
                color={"gray"}
                size={"large"}
              />
            }
            title={"Add Cloud Access"}
            description={
              "It looks like you don't have any cloud access connections. Connect a cloud provider account to start authorizing federated cloud access through NetBird policy."
            }
            button={
              <div className={"gap-x-4 flex items-center justify-center"}>
                <AddCloudAccessButton />
              </div>
            }
          />
        }
        rightSide={() =>
          data &&
          data.length > 0 && (
            <div className={cn("gap-x-4 ml-auto flex")}>
              <AddCloudAccessButton />
            </div>
          )
        }
      >
        {() => (
          <DataTableRefreshButton
            isDisabled={data?.length == 0}
            onClick={() => {
              mutate("/cloud-access").then();
            }}
          />
        )}
      </DataTable>
    </>
  );
}

const AddCloudAccessButton = () => {
  const { permission } = usePermissions();
  const { openCreateAccessModal } = useCloudAccessContext();
  return (
    <Button
      variant={"primary"}
      onClick={openCreateAccessModal}
      disabled={!permission.cloud_access.create}
      data-testid={"add-cloud-access"}
    >
      <PlusCircle size={16} />
      Add Cloud Access
    </Button>
  );
};
