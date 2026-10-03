import ResourceBadge from "@components/ui/ResourceBadge";
import useFetchApi from "@utils/api";
import * as React from "react";
import Skeleton from "react-loading-skeleton";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { CloudRole } from "@/interfaces/CloudAccess";
import { NetworkResource } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import { PolicyRuleResource } from "@/interfaces/Policy";

type Props = {
  resource?: PolicyRuleResource;
};

export const AccessControlResourceCell = ({ resource }: Props) => {
  const { permission } = usePermissions();
  const { data: resources, isLoading: isLoadingResources } = useFetchApi<
    NetworkResource[]
  >("/networks/resources");
  const { data: peers, isLoading: isLoadingPeers } =
    useFetchApi<Peer[]>("/peers");
  
  const { data: cloudRoles, isLoading: isLoadingCloudRoles } =
    useFetchApi<CloudRole[]>(
      "/cloud-roles",
      false,
      true,
      !!permission?.cloud_access?.read,
    );

  const isPeer = resource?.type === "peer";
  const isCloudRole = resource?.type === "cloud_integration";
  const peer = peers?.find((p) => p.id === resource?.id);
  const cloudRole = cloudRoles?.find((c) => c.id === resource?.id);

  const isLoading = isPeer
    ? isLoadingPeers
    : isCloudRole
      ? isLoadingCloudRoles
      : isLoadingResources;
  if (isLoading) return <Skeleton height={35} width={"50%"} />;

  return (
    <div className={"flex"}>
      <ResourceBadge
        resource={resources?.find((r) => r.id === resource?.id)}
        peer={peer}
        cloudRole={cloudRole}
      />
    </div>
  );
};
