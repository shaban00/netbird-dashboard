import React from "react";
import Badge from "@components/Badge";
import FullTooltip from "@components/FullTooltip";
import { cn } from "@utils/helpers";
import { HelpCircle } from "lucide-react";
import CircleIcon from "@/assets/icons/CircleIcon";
import {
  CloudRoleStatus,
  cloudRoleStatusLabels,
} from "@/interfaces/CloudAccess";

type Props = {
  status: CloudRoleStatus;
  className?: string;
};

export default function CloudRoleStatusBadge({
  status,
  className,
}: Readonly<Props>) {
  if (status === "pending") {
    return (
      <FullTooltip
        content={
          <div className={"text-xs max-w-xs"}>
            This role hasn&apos;t been validated yet. Run its deploy script,
            then click Validate to connect it.
          </div>
        }
        interactive={false}
      >
        <Badge variant={"yellow"} className={cn("cursor-help", className)}>
          {cloudRoleStatusLabels[status]}
          <HelpCircle size={12} />
        </Badge>
      </FullTooltip>
    );
  }

  if (status === "error") {
    return (
      <FullTooltip
        content={
          <div className={"text-xs max-w-xs"}>
            Informational only — does not block credential requests. Reflects
            the last exchange attempt; click Validate to re-check now.
          </div>
        }
        interactive={false}
      >
        <div
          className={cn(
            "flex items-center gap-2 cursor-help",
            className,
          )}
        >
          <CircleIcon inactiveDot={"red"} size={8} />
          <span className={"text-nb-gray-300"}>
            {cloudRoleStatusLabels[status]}
          </span>
          <HelpCircle size={12} className={"text-nb-gray-400"} />
        </div>
      </FullTooltip>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <CircleIcon active={status === "connected"} size={8} />
      <span className={"text-nb-gray-300"}>
        {cloudRoleStatusLabels[status]}
      </span>
    </div>
  );
}
