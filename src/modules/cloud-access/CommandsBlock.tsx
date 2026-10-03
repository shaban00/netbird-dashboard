import React from "react";
import { cn } from "@utils/helpers";
import { CheckIcon, CopyIcon } from "lucide-react";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";

type Props = {
  commands: string;
};

export default function CommandsBlock({ commands }: Readonly<Props>) {
  const [, copyToClipboard, copied] = useCopyToClipboard(commands);

  return (
    <div
      className={cn(
        "relative w-full min-w-0 rounded-md border text-sm",
        "border-neutral-200 dark:border-nb-gray-700 bg-gray-50 dark:bg-nb-gray-900",
      )}
    >
      <pre
        className={cn(
          "font-mono text-xs leading-relaxed whitespace-pre",
          "max-h-72 min-w-0 overflow-auto p-3 pr-10",
        )}
      >
        {commands}
      </pre>
      <span
        onClick={() => copyToClipboard("Commands copied to clipboard.")}
        className={"absolute right-0 top-0 pt-3 pr-3 cursor-pointer z-10"}
        data-testid="copy-commands-to-clipboard"
      >
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </span>
    </div>
  );
}
