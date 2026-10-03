import { CloudIcon } from "lucide-react";
import * as React from "react";

const PROVIDER_COLORS: Record<string, string> = {
  aws: "#FF9900",
  gcp: "#4285F4",
  azure: "#0078D4",
};

type Props = {
  provider: string;
  size?: number;
  className?: string;
};

export default function CloudProviderIcon({
  provider,
  size = 16,
  className,
}: Readonly<Props>) {
  const color = PROVIDER_COLORS[provider] ?? "#6B7280";
  return (
    <CloudIcon
      size={size}
      style={{ color }}
      className={className ?? "shrink-0"}
    />
  );
}
