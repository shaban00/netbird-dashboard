import { CloudProviderName } from "@/interfaces/CloudAccess";

const awsAccountIdDigits = "\\d{12}";
const awsRoleNameChars = "[\\w+=,.@-]{1,64}";

const awsAccountIdPattern = new RegExp(`^${awsAccountIdDigits}$`);
const gcpProjectNumberPattern = /^[1-9]\d{5,11}$/;

export const azureGUIDPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const accountIdPatterns: Record<CloudProviderName, RegExp> = {
  aws: awsAccountIdPattern,
  gcp: gcpProjectNumberPattern,
  azure: azureGUIDPattern,
};

export const accountIdLabels: Record<CloudProviderName, string> = {
  aws: "AWS Account ID",
  gcp: "GCP Project Number",
  azure: "Azure Tenant ID",
};

export const accountIdHelpText: Record<CloudProviderName, string> = {
  aws: "The 12-digit ID of the AWS account to connect",
  gcp: "The project number of the GCP project to connect",
  azure: "The Tenant (Directory) ID of the Azure AD tenant to connect",
};

export const accountIdPlaceholders: Record<CloudProviderName, string> = {
  aws: "123456789012",
  gcp: "987654321098",
  azure: "72f988bf-86f1-41af-91ab-2d7cd011db47",
};

export const providerArticles: Record<CloudProviderName, string> = {
  aws: "an",
  gcp: "a",
  azure: "an",
};

const awsPrincipalNamePattern = new RegExp(`^${awsRoleNameChars}$`);
const gcpServiceAccountIdChars = "[a-z][a-z0-9-]{5,29}";
const gcpProjectIdChars = "[a-z][a-z0-9-]{4,28}[a-z0-9]";

export const gcpProjectIdPattern = new RegExp(`^${gcpProjectIdChars}$`);
export const gcpProjectIdLabel = "GCP Project ID";
export const gcpProjectIdHelpText = "The project's Project ID";
export const gcpProjectIdPlaceholder = "my-project-123";

export const gcpServiceAccountEmailSuffix = ".iam.gserviceaccount.com";

export function gcpServiceAccountEmail(
  serviceAccountId: string,
  projectId: string,
): string {
  return `${serviceAccountId}@${projectId}${gcpServiceAccountEmailSuffix}`;
}

const gcpPrincipalNameInputPattern = new RegExp(`^${gcpServiceAccountIdChars}$`);

export const principalNameInputPatterns: Record<CloudProviderName, RegExp> = {
  aws: awsPrincipalNamePattern,
  gcp: gcpPrincipalNameInputPattern,
  azure: azureGUIDPattern,
};

export const principalNameLabels: Record<CloudProviderName, string> = {
  aws: "IAM Role Name",
  gcp: "Service Account ID",
  azure: "Application (Client) ID",
};

export const principalNamePlaceholders: Record<CloudProviderName, string> = {
  aws: "NetBirdDeveloper",
  gcp: "netbird-developer",
  azure: "3b1e0c8f-4d2a-4b9e-9c7a-1f2e3d4c5b6a",
};

export const principalNameHelpText: Record<CloudProviderName, string> = {
  aws: "Must be a unique IAM role name in this AWS account.",
  gcp: "NetBird appends this connection's project to build the full email. Must be unique in this GCP project.",
  azure: "The dedicated App Registration's Application (Client) ID. Left blank when creating a new App Registration — the deploy script prints this value once it's created.",
};

export const principalNameLockedHelpText: Record<CloudProviderName, string> = {
  aws: "Locked while connected — the deploy script already set up a role with this exact name in AWS. Delete and recreate the role to use a different one.",
  gcp: "Locked while connected — the deploy script already created a service account binding for this exact email in GCP. Delete and recreate the role to use a different one.",
  azure: "Locked while connected — the deploy script already created a Federated Credential for this exact App Registration in Azure. Delete and recreate the role to use a different one.",
};

export const credentialLifetimeMinutesBounds: Partial<
  Record<CloudProviderName, { min: number; max: number }>
> = {
  aws: { min: 15, max: 60 },
  gcp: { min: 10, max: 60 },
};

export const credentialLifetimeHelpText: Partial<
  Record<CloudProviderName, string>
> = {
  aws: "Shorter lifetimes revoke access faster but require more frequent re-authentication, while longer ones need less re-authentication but stay valid longer after access is revoked.",
  gcp: "Shorter lifetimes revoke access faster but require more frequent re-authentication, while longer ones need less re-authentication but stay valid longer after access is revoked. NetBird configures this value in the peer's local credential file — it isn't enforced by GCP server-side, so treat it as guidance rather than a hard cap.",
};

export const credentialLifetimeReferenceLinks: Partial<
  Record<CloudProviderName, string>
> = {
  aws: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html",
  gcp: "https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken",
};

export const azureTokenLifetimeHelpText =
  "Azure sets the token lifetime automatically — 60–90 minutes by default — rather than accepting a caller-specified value.";
export const azureTokenLifetimeReferenceLink =
  "https://learn.microsoft.com/en-us/entra/identity-platform/configurable-token-lifetimes";

export function parseAWSRoleARN(
  arn: string,
): { accountId: string; roleName: string } | null {
  const pattern = new RegExp(
    `^arn:aws:iam::(${awsAccountIdDigits}):role/(${awsRoleNameChars})$`,
  );
  const match = pattern.exec(arn.trim());
  if (!match) return null;
  return { accountId: match[1], roleName: match[2] };
}
