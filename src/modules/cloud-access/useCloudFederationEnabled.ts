import useFetchApi from "@utils/api";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Account } from "@/interfaces/Account";

export const useCloudFederationEnabled = () => {
  const { permission } = usePermissions();
  const { data: accounts, isLoading } = useFetchApi<Account[]>(
    "/accounts",
    true,
    true,
    permission?.accounts?.read,
  );

  const enabled = accounts?.[0]?.settings?.cloud_federation_enabled === true;
  return { enabled, isLoading } as const;
};
