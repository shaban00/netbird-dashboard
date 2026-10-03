import * as React from "react";
import { DropdownInput } from "@components/DropdownInput";
import Kbd from "@components/Kbd";
import { Modal, ModalContent } from "@components/modal/Modal";
import { VirtualScrollAreaList } from "@components/VirtualScrollAreaList";
import { useSearch } from "@hooks/useSearch";
import useFetchApi from "@utils/api";
import { removeAllSpaces } from "@utils/helpers";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloudIcon,
  CornerDownLeft,
  ShieldCheckIcon,
  TextSearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import {
  CloudAccess,
  cloudProviderNameLabels,
  CloudRole,
} from "@/interfaces/CloudAccess";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

enum SearchType {
  CloudAccess = "cloud-access",
  CloudRole = "cloud-role",
}

type SearchResult<T, U extends SearchType> = {
  type: U;
  id: string;
  data: T;
  onAction?: (item: T) => void;
};

type CloudAccessSearchResult = SearchResult<CloudAccess, SearchType.CloudAccess>;
type CloudRoleSearchResult = SearchResult<CloudRole, SearchType.CloudRole>;
type AnySearchResult = CloudAccessSearchResult | CloudRoleSearchResult;

const searchPredicate = (item: AnySearchResult, query: string) => {
  if (!query) return false;
  const lower = removeAllSpaces(query.toLowerCase());
  const find = (s: string | undefined) =>
    removeAllSpaces(s?.toLowerCase()).includes(lower);

  if (item.type === SearchType.CloudAccess) {
    if (find(item.data.name)) return true;
    if (find(item.data.provider)) return true;
    if (find(item.data.provider_account_id)) return true;
    if (find(item.data.provider_project_id)) return true;
    if (find(item.data.id)) return true;
  }

  if (item.type === SearchType.CloudRole) {
    if (find(item.data.name)) return true;
    if (find(item.data.principal_name)) return true;
    if (find(item.data.id)) return true;
  }

  return false;
};

export const CloudAccessSearchModal = ({ open, setOpen }: Props) => {
  return open && <CloudAccessSearchModalContent open={open} setOpen={setOpen} />;
};

const CloudAccessSearchModalContent = ({ open, setOpen }: Props) => {
  const router = useRouter();

  const { data: access, isLoading: isAccessLoading } = useFetchApi<
    CloudAccess[]
  >("/cloud-access", true, false, open, {
    key: "cloud-access-search-connections",
  });
  const { data: roles, isLoading: isRolesLoading } = useFetchApi<CloudRole[]>(
    "/cloud-roles",
    true,
    false,
    open,
    { key: "cloud-access-search-roles" },
  );

  const findAccessByRoleCloudAccessId = (cloudAccessId: string) => {
    return access?.find((a) => a.id === cloudAccessId);
  };

  const items: AnySearchResult[] = useMemo(() => {
    if (isAccessLoading || isRolesLoading) return [];
    const accessResults: CloudAccessSearchResult[] = (access ?? []).map(
      (a) => ({
        type: SearchType.CloudAccess,
        id: a.id,
        data: a,
        onAction: () => router.push(`/cloud-access-detail?id=${a.id}`),
      }),
    );

    const roleResults: CloudRoleSearchResult[] = (roles ?? []).map(
      (role) => ({
        type: SearchType.CloudRole,
        id: role.id,
        data: role,
        onAction: () =>
          router.push(`/cloud-access-detail?id=${role.cloud_access_id}`),
      }),
    );

    return [...accessResults, ...roleResults];
  }, [isAccessLoading, isRolesLoading, access, roles, router]);

  const [filteredItems, search, setSearch, setQuery, isSearching] = useSearch(
    items,
    searchPredicate,
    {
      filter: false,
      debounce: 350,
    },
  );

  const isLoading = isAccessLoading || isRolesLoading || isSearching;

  const accessCount = useMemo(() => {
    return filteredItems.filter((i) => i.type === SearchType.CloudAccess)
      .length;
  }, [filteredItems]);

  const roleCount = useMemo(() => {
    return filteredItems.filter((i) => i.type === SearchType.CloudRole)
      .length;
  }, [filteredItems]);

  return (
    <div>
      <Modal
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSearch("");
          setOpen(isOpen);
        }}
      >
        <ModalContent
          showClose={false}
          className={"py-0 overflow-hidden"}
          maxWidthClass={"max-w-xl"}
        >
          <DropdownInput
            hideEnterIcon={true}
            value={search}
            onChange={setSearch}
            autoFocus={true}
          />

          {search === "" && <BlankState />}

          {isLoading && search !== "" && <LoadingState />}

          {!isSearching && search !== "" && filteredItems.length === 0 && (
            <NotFoundState />
          )}

          {!isSearching && search != "" && filteredItems.length !== 0 && (
            <VirtualScrollAreaList
              items={filteredItems}
              maxHeight={400}
              scrollAreaClassName={"pt-0"}
              groupKey={(i) => i.type}
              estimatedItemHeight={48}
              estimatedHeadingHeight={32}
              heightAdjustment={5}
              onSelect={(item) => {
                if (item.type === SearchType.CloudAccess)
                  item.onAction?.(item.data);
                if (item.type === SearchType.CloudRole)
                  item.onAction?.(item.data);
              }}
              renderHeading={(item) => {
                return (
                  <div className={"text-xs text-nb-gray-400 px-4 py-2"}>
                    {item.type === SearchType.CloudAccess &&
                      `Cloud Access (${accessCount})`}
                    {item.type === SearchType.CloudRole &&
                      `Roles (${roleCount})`}
                  </div>
                );
              }}
              renderItem={(item) => {
                const parentAccess =
                  item.type === SearchType.CloudRole
                    ? findAccessByRoleCloudAccessId(item.data.cloud_access_id)
                    : undefined;

                return (
                  <div className={"flex justify-between items-center w-full"}>
                    <div className={"flex justify-between items-center gap-3"}>
                      <div
                        className={
                          "h-8 w-8 bg-nb-gray-850 group-aria-selected/list-item:bg-nb-gray-700 flex items-center justify-center rounded-md"
                        }
                      >
                        {item.type === SearchType.CloudAccess && (
                          <CloudIcon size={14} />
                        )}
                        {item.type === SearchType.CloudRole && (
                          <ShieldCheckIcon size={14} />
                        )}
                      </div>
                      <div>
                        <div>
                          {item.data.name}
                          {parentAccess && ` - ${parentAccess.name}`}
                        </div>
                        <div className={"text-nb-gray-400"}>
                          {item.type === SearchType.CloudAccess &&
                            cloudProviderNameLabels[item.data.provider]}
                          {item.type === SearchType.CloudRole &&
                            item.data.principal_name}
                        </div>
                      </div>
                    </div>
                    <div>
                      <CornerDownLeft
                        size={14}
                        className={
                          "opacity-0 group-aria-selected/list-item:opacity-100 group-list-item-aria-selected:opacity-100"
                        }
                      />
                    </div>
                  </div>
                );
              }}
            />
          )}
          <KeyboardShortcutsFooter />
        </ModalContent>
      </Modal>
    </div>
  );
};

const BlankState = () => {
  return (
    <div className={"flex items-center justify-center pb-8"}>
      <div className={"text-center"}>
        <div className={"flex items-center justify-center mb-3 mt-3 gap-3"}>
          <div
            className={
              "bg-nb-gray-920 h-8 w-8 flex items-center justify-center rounded-md"
            }
          >
            <CloudIcon size={16} />
          </div>
          <div
            className={
              "bg-nb-gray-920 h-8 w-8 flex items-center justify-center rounded-md"
            }
          >
            <ShieldCheckIcon size={16} />
          </div>
        </div>

        <div className={"text-nb-gray-100 mb-1"}>
          Search for Cloud Access and Roles
        </div>
        <div className={"text-sm text-nb-gray-350 font-light"}>
          Quickly find cloud access connections and their roles. <br />
          Start typing to search by name, provider or principal.
        </div>
      </div>
    </div>
  );
};

const NotFoundState = () => {
  return (
    <div className={"flex items-center justify-center pb-8"}>
      <div className={"text-center"}>
        <div className={"flex items-center justify-center mb-3 mt-3 gap-3"}>
          <div
            className={
              "bg-nb-gray-920 h-8 w-8 flex items-center justify-center rounded-md"
            }
          >
            <TextSearchIcon size={16} />
          </div>
        </div>

        <div className={"text-nb-gray-100 mb-1"}>
          Could not find any results
        </div>
        <div className={"text-sm text-nb-gray-350 font-light max-w-xs"}>
          {`We couldn't find any results. Please try a different search term.`}
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => {
  return (
    <div className={"flex flex-col gap-1 px-3 mb-4 opacity-50"}>
      <Skeleton width={"100%"} height={40} />
      <Skeleton width={"100%"} height={40} />
      <Skeleton width={"100%"} height={40} />
    </div>
  );
};

const KeyboardShortcutsFooter = () => {
  return (
    <div
      className={
        "bg-nb-gray-940 border-t border-nb-gray-910 px-4 py-3 text-xs text-nb-gray-300 flex items-center gap-5"
      }
    >
      <div className={"flex items-center gap-1.5"}>
        <Kbd variant={"darker"}>
          <ArrowUpIcon size={12} />
        </Kbd>
        <Kbd variant={"darker"}>
          <ArrowDownIcon size={12} />
        </Kbd>
        <div className={"ml-1"}>Navigate</div>
      </div>
      <div className={"flex items-center gap-1.5"}>
        <Kbd variant={"darker"}>
          <CornerDownLeft size={12} />
        </Kbd>
        <div className={"ml-1"}>Open</div>
      </div>
      <div className={"flex items-center gap-1.5"}>
        <Kbd variant={"darker"} className={"text-[0.65rem] font-medium"}>
          esc
        </Kbd>
        <div className={"ml-1"}>Close</div>
      </div>
    </div>
  );
};
