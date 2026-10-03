import Badge from "@components/Badge";
import TruncatedText from "@components/ui/TruncatedText";
import { cn } from "@utils/helpers";
import { GlobeIcon, NetworkIcon, WorkflowIcon, XIcon, CloudIcon } from "lucide-react";
import * as React from "react";
import { NetworkResource } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { PeerOperatingSystemIcon } from "@/modules/peers/PeerOperatingSystemIcon";
import { CloudRole } from "@/interfaces/CloudAccess";

type Props = {
  resource?: NetworkResource;
  peer?: Peer;
  cloudRole?: CloudRole;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  showX?: boolean;
  children?: React.ReactNode;
  className?: string;
};
export default function ResourceBadge({
  onClick,
  resource,
  peer,
  cloudRole,
  showX = false,
  children,
  className,
}: Readonly<Props>) {
  if (!resource && !peer && !cloudRole) return;

  const isPeer = !!peer;
  const isCloudRole = !!cloudRole;
  const key = resource ? resource.id || resource?.name : peer ? peer?.id || peer?.name : cloudRole?.id || cloudRole?.name;

  return (
    <Badge
      key={key}
      useHover={true}
      data-testid={"resource-badge"}
      variant={"gray-ghost"}
      className={cn(
        "transition-all group whitespace-nowrap",
        className,
        isPeer && "px-2",
      )}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    >
      {isPeer ? (
        <>
          <PeerOperatingSystemIcon os={peer?.os} />
          <TruncatedText text={peer?.name || ""} maxChars={20} />
        </>
      ) : isCloudRole ? (
        <>
          <ResourceIcon type={"cloud_integration"} />
          <TruncatedText text={cloudRole?.name || ""} maxChars={20} />
        </>
      ) : (
        <>
          <ResourceIcon type={resource?.type || ""} />
          <TruncatedText text={resource?.name || ""} maxChars={20} />
        </>
      )}

      {children}
      {showX && (
        <XIcon
          size={12}
          className={
            "cursor-pointer group-hover:text-nb-gray-100 transition-all shrink-0"
          }
        />
      )}
    </Badge>
  );
}

const ResourceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "host":
      return <WorkflowIcon size={12} className={"shrink-0"} />;
    case "domain":
      return <GlobeIcon size={12} className={"shrink-0"} />;
    case "subnet":
      return <NetworkIcon size={12} className={"shrink-0"} />;
    case "cloud_integration":
      return <CloudIcon size={12} className={"shrink-0"} />;
    default:
      // Draft resources without an address have no type yet — default icon.
      return <WorkflowIcon size={12} className={"shrink-0"} />;
  }
};
