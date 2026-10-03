import { notify } from "@components/Notification";
import { ErrorResponse, useApiCall } from "@utils/api";
import { CloudAccess, CloudRole } from "@/interfaces/CloudAccess";

export function useCloudRoleValidate(
  access: CloudAccess,
  role: CloudRole,
  onValidated: (() => void) | undefined,
  onClose: () => void,
  beforeValidate?: () => Promise<void>,
) {
  const validateRequest = useApiCall<CloudRole>(
    `/cloud-access/${access.id}/roles/${role.id}/validate`,
  );

  return () => {
    const run = beforeValidate ? beforeValidate() : Promise.resolve();
    notify({
      title: "Validate Cloud Role",
      description: "Connection check complete — see the updated status below.",
      promise: run.then(() => validateRequest.post({})).then((updated) => {
        onValidated?.();

        if (updated.status === "error") {
          return Promise.reject({
            code: 418,
            message:
              "The trust relationship check failed — see the role's status for details.",
          } satisfies ErrorResponse);
        }

        onClose();
      }),
      loadingMessage: "Checking the trust relationship...",
    });
  };
}
