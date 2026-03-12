import dynamic from "next/dynamic";

import { cn } from "@ethereum-entity-registry/ui/lib/utils";
const ReactMarkdown = dynamic(() => import("react-markdown"), {});

export function Markdown({
  children = "",
  className,
}: {
  children?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-stone dark:prose-invert max-w-none",
        className,
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
