export type CloudProviderName = "aws" | "gcp" | "azure";

export type CloudAccessStatus = "pending" | "connected";

export interface CloudAccess {
  id: string;
  name: string;
  provider: CloudProviderName;
  provider_account_id?: string;
  // GCP only. The Project ID string (e.g. "my-project-123")
  provider_project_id?: string;
  status: CloudAccessStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CloudAccessRequest {
  name: string;
  provider: CloudProviderName;
  provider_account_id?: string;
  // GCP only, required for a GCP connection
  provider_project_id?: string;
}

export interface CloudDeployStep {
  title: string;
  description: string;
  command: string;
}

export interface CloudDeployStepsResponse {
  steps: CloudDeployStep[];
}

export const cloudAccessStatusLabels: Record<CloudAccessStatus, string> = {
  pending: "Pending",
  connected: "Connected",
};

export const cloudProviderNameLabels: Record<CloudProviderName, string> = {
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
};

export const cloudProviderCatalog: {
  id: CloudProviderName;
  label: string;
  enabled: boolean;
}[] = [
  { id: "aws", label: "AWS", enabled: true },
  { id: "gcp", label: "GCP", enabled: true },
  { id: "azure", label: "Azure", enabled: true },
];

export type CloudRoleStatus = "pending" | "connected" | "error";

export interface CloudRole {
  id: string;
  cloud_access_id: string;
  name: string;
  principal_name?: string;
  principal_ref?: string;
  credential_lifetime_seconds?: number;
  status: CloudRoleStatus;
  last_validated_at?: string;
  setup_mode?: "create" | "import";
  created_at?: string;
  updated_at?: string;
}

export interface CloudRoleRequest {
  name: string;
  principal_name?: string;
  credential_lifetime_seconds?: number;
  setup_mode?: "create" | "import";
}

export const cloudRoleStatusLabels: Record<CloudRoleStatus, string> = {
  pending: "Pending Verification",
  connected: "Connected",
  error: "Error",
};
