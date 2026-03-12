import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "@ethereum-entity-registry/ui/lib/utils";

interface PageProps {
  children: ReactNode;
  backLink?: {
    href: string;
    label?: string;
  };
  title?: string | ReactNode;
  description?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
  spacing?: "default" | "compact";
}

export function Page({
  children,
  backLink,
  title,
  description,
  actions,
  className,
  spacing = "default",
}: PageProps) {
  const hasHeader = backLink || title || description || actions;

  return (
    <div
      className={cn(
        "px-6 py-8",
        {
          "space-y-12": spacing === "default",
          "space-y-10": spacing === "compact",
        },
        className,
      )}
    >
      {backLink && (
        <Link
          href={backLink.href}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />{" "}
          {backLink.label || "Back"}
        </Link>
      )}

      {hasHeader && (title || description) && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            {title && (
              <div className="space-y-1">
                {typeof title === "string" ? (
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {title}
                  </h1>
                ) : (
                  title
                )}
                {description && (
                  <>
                    {typeof description === "string" ? (
                      <p className="text-muted-foreground text-lg max-w-lg">
                        {description}
                      </p>
                    ) : (
                      description
                    )}
                  </>
                )}
              </div>
            )}
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
