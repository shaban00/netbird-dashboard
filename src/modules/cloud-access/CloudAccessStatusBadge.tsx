import React from "react";
import CircleIcon from "@/assets/icons/CircleIcon";
import {
  CloudAccessStatus,
  cloudAccessStatusLabels,
} from "@/interfaces/CloudAccess";

type Props = {
  status: CloudAccessStatus;
  className?: string;
};

export default function CloudAccessStatusBadge({
  status,
  className,
}: Readonly<Props>) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <CircleIcon active={status === "connected"} inactiveDot={"gray"} size={8} />
      <span className={"text-nb-gray-300"}>
        {cloudAccessStatusLabels[status]}
      </span>
    </div>
  );
}
