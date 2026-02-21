import { AlertCircleIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";

interface ErrorBannerProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorBanner({
  title = "Failed to load some data",
  description = "Some sections may not display correctly. Please try again.",
  onRetry,
}: ErrorBannerProps) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {description}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
