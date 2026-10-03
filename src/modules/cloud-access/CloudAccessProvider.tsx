import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import * as React from "react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { CloudAccess, CloudRole } from "@/interfaces/CloudAccess";
import CloudAccessModal from "@/modules/cloud-access/CloudAccessModal";
import CloudDeployModal from "@/modules/cloud-access/CloudDeployModal";
import CloudRoleModal from "@/modules/cloud-access/CloudRoleModal";

type Props = {
  children: React.ReactNode;
};

const CloudAccessContext = React.createContext(
  {} as {
    openCreateAccessModal: () => void;
    openEditAccessModal: (access: CloudAccess) => void;
    deleteCloudAccess: (access: CloudAccess) => Promise<void>;
    openRoleModal: (access: CloudAccess, role?: CloudRole) => void;
    deleteRole: (access: CloudAccess, role: CloudRole) => Promise<void>;
    openDeployRoleModal: (access: CloudAccess, role: CloudRole) => void;
  },
);

export const CloudAccessProvider = ({ children }: Props) => {
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();
  const accessDeleteCall = useApiCall("/cloud-access").del;
  const roleDeleteCall = useApiCall("/cloud-access").del;

  const [currentAccess, setCurrentAccess] = useState<CloudAccess>();
  const [currentRole, setCurrentRole] = useState<CloudRole>();

  const [accessModal, setAccessModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [deployRoleModal, setDeployRoleModal] = useState(false);

  const openCreateAccessModal = () => {
    setCurrentAccess(undefined);
    setAccessModal(true);
  };

  const openEditAccessModal = (access: CloudAccess) => {
    setCurrentAccess(access);
    setAccessModal(true);
  };

  const openRoleModal = (access: CloudAccess, role?: CloudRole) => {
    setCurrentAccess(access);
    setCurrentRole(role);
    setRoleModal(true);
  };

  const openDeployRoleModal = (access: CloudAccess, role: CloudRole) => {
    setCurrentAccess(access);
    setCurrentRole(role);
    setDeployRoleModal(true);
  };

  const askToSetUp = async (access: CloudAccess) => {
    const choice = await confirm({
      title: `Add Role to '${access.name}'?`,
      description:
        "NetBird policy will be able to authorize federated access to a role once you add it.",
      confirmText: "Add Role",
      cancelText: "Later",
      type: "default",
    });
    if (!choice) return;
    openRoleModal(access);
  };

  const deleteCloudAccess = async (access: CloudAccess) => {
    const choice = await confirm({
      title: `Delete '${access.name}'?`,
      description:
        "Are you sure you want to delete this cloud access connection? Delete its roles first if it has any. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!choice) return;

    const promise = accessDeleteCall({}, `/${access.id}`).then(() => {
      mutate("/cloud-access");
    });

    notify({
      title: access.name,
      description: "Cloud access connection deleted successfully.",
      loadingMessage: "Deleting cloud access connection...",
      promise,
    });

    return promise;
  };

  const deleteRole = async (access: CloudAccess, role: CloudRole) => {
    const choice = await confirm({
      title: `Delete '${role.name}'?`,
      description:
        "Are you sure you want to delete this cloud role? Any policy rules referencing it must be removed first. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!choice) return;

    const promise = roleDeleteCall(
      {},
      `/${access.id}/roles/${role.id}`,
    ).then(() => {
      mutate(`/cloud-access/${access.id}/roles`);
      mutate("/cloud-roles");
      mutate("/cloud-access");
      mutate(`/cloud-access/${access.id}`);
    });

    notify({
      title: role.name,
      description: "Cloud role deleted successfully.",
      loadingMessage: "Deleting cloud role...",
      promise,
    });

    return promise;
  };

  return (
    <CloudAccessContext.Provider
      value={{
        openCreateAccessModal,
        openEditAccessModal,
        deleteCloudAccess,
        openRoleModal,
        deleteRole,
        openDeployRoleModal,
      }}
    >
      {children}

      <CloudAccessModal
        open={accessModal}
        key={accessModal ? "access-1" : "access-0"}
        onClose={() => {
          setAccessModal(false);
          setCurrentAccess(undefined);
        }}
        access={currentAccess}
        onCreated={(access) => {
          setAccessModal(false);
          mutate("/cloud-access");
          void askToSetUp(access);
        }}
      />

      {currentAccess && (
        <>
          <CloudRoleModal
            open={roleModal}
            key={roleModal ? "role-1" : "role-0"}
            access={currentAccess}
            role={currentRole}
            onClose={() => {
              setRoleModal(false);
              setCurrentRole(undefined);
            }}
            onCreated={(role) => {
              setRoleModal(false);
              mutate(`/cloud-access/${currentAccess.id}/roles`);
              mutate("/cloud-roles");
              mutate("/cloud-access");
              mutate(`/cloud-access/${currentAccess.id}`);
              openDeployRoleModal(currentAccess, role);
            }}
            onUpdated={() => {
              setRoleModal(false);
              setCurrentRole(undefined);
              mutate(`/cloud-access/${currentAccess.id}/roles`);
              mutate("/cloud-roles");
              mutate("/cloud-access");
              mutate(`/cloud-access/${currentAccess.id}`);
            }}
          />

          {currentRole && deployRoleModal && (
            <CloudDeployModal
              open={deployRoleModal}
              access={currentAccess}
              role={currentRole}
              onClose={() => {
                setDeployRoleModal(false);
              }}
              onValidated={() => {
                mutate(`/cloud-access/${currentAccess.id}/roles`);
                mutate("/cloud-roles");
                mutate("/cloud-access");
                mutate(`/cloud-access/${currentAccess.id}`);
              }}
            />
          )}
        </>
      )}
    </CloudAccessContext.Provider>
  );
};

export const useCloudAccessContext = () => {
  const context = React.useContext(CloudAccessContext);
  if (context === undefined) {
    throw new Error(
      "useCloudAccessContext must be used within a CloudAccessProvider",
    );
  }
  return context;
};
