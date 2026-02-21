"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { UploadIcon, XCircleIcon, FileJsonIcon } from "lucide-react";

interface ImportAllocationsDialogProps {
  existingAddresses: string[];
  onImport: (
    allocations: Array<{
      recipient: string;
      weight: number;
      label?: string;
    }>,
  ) => void;
  disabled?: boolean;
}

interface ParsedAllocation {
  recipient: string;
  weight: number;
  label?: string;
  isDuplicate: boolean;
  error?: string;
}

export function ImportAllocationsDialog({
  existingAddresses,
  onImport,
  disabled = false,
}: ImportAllocationsDialogProps) {
  const [open, setOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedAllocation[]>([]);
  const [activeTab, setActiveTab] = useState("input");

  const handleParse = () => {
    try {
      const data = JSON.parse(jsonInput);

      if (!Array.isArray(data)) {
        throw new Error("Expected an array of allocations");
      }

      if (data.length === 0) {
        throw new Error("Array is empty");
      }

      const validated: ParsedAllocation[] = data.map((item, index) => {
        let error: string | undefined;

        if (!item.recipient) {
          error = "Missing recipient address";
        } else if (!isAddress(item.recipient)) {
          error = "Invalid Ethereum address";
        }

        if (!error && (typeof item.weight !== "number" || item.weight < 0)) {
          error = "Invalid weight (must be a positive number)";
        }

        const isDuplicate = existingAddresses.some(
          (addr) => addr.toLowerCase() === item.recipient?.toLowerCase(),
        );

        return {
          recipient: item.recipient || "",
          weight: item.weight || 0,
          label: item.label || "",
          isDuplicate,
          error,
        };
      });

      setParsedData(validated);
      setParseError(null);
      setActiveTab("preview");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON format");
      setParsedData([]);
    }
  };

  const handleImport = () => {
    const validAllocations = parsedData.filter(
      (a) => !a.error && !a.isDuplicate,
    );

    if (validAllocations.length === 0) {
      toast.error("No valid allocations to import");
      return;
    }

    onImport(validAllocations);

    const skippedCount = parsedData.length - validAllocations.length;
    if (skippedCount > 0) {
      toast.success(
        `Imported ${validAllocations.length} allocation${validAllocations.length !== 1 ? "s" : ""} (${skippedCount} skipped)`,
      );
    } else {
      toast.success(
        `Imported ${validAllocations.length} allocation${validAllocations.length !== 1 ? "s" : ""}`,
      );
    }

    // Reset and close
    setJsonInput("");
    setParsedData([]);
    setParseError(null);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setJsonInput("");
      setParsedData([]);
      setParseError(null);
      setActiveTab("input");
    }
  };

  const validCount = parsedData.filter(
    (a) => !a.error && !a.isDuplicate,
  ).length;
  const duplicateCount = parsedData.filter((a) => a.isDuplicate).length;
  const errorCount = parsedData.filter((a) => a.error).length;

  const exampleJson = `[
  {
    "recipient": "0x...",
    "weight": 100,
    "label": "Team A"
  },
  {
    "recipient": "0x...",
    "weight": 50,
    "label": "Team B"
  }
]`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              disabled={disabled}
            >
              <UploadIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Import allocations from JSON</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Allocations from JSON</DialogTitle>
          <DialogDescription>
            Paste a JSON array of allocations. Each allocation should have a
            recipient address, weight, and optional label.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="w-full">
            <TabsTrigger value="input" className="flex-1">
              Input
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex-1"
              disabled={parsedData.length === 0}
            >
              Preview
              {parsedData.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {validCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="input"
            className="flex-1 space-y-4 overflow-y-auto mt-4"
          >
            {/* JSON Input */}
            <div className="space-y-3">
              <Textarea
                placeholder={exampleJson}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="font-mono text-xs min-h-[300px] max-h-[400px]"
                spellCheck={false}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleParse}
                  disabled={!jsonInput.trim()}
                >
                  <FileJsonIcon className="w-3.5 h-3.5 mr-1.5" />
                  Parse JSON
                </Button>
              </div>
            </div>

            {/* Parse Error */}
            {parseError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <div className="flex items-start gap-2">
                  <XCircleIcon className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">
                      Parse Error
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parseError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="preview"
            className="flex-1 space-y-4 overflow-y-auto mt-4"
          >
            {parsedData.length > 0 && (
              <>
                {/* Summary Badges */}
                <div className="flex gap-2 text-xs">
                  {validCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    >
                      {validCount} new
                    </Badge>
                  )}
                  {duplicateCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-muted-foreground"
                    >
                      {duplicateCount} duplicate
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-destructive/10 text-destructive"
                    >
                      {errorCount} error
                    </Badge>
                  )}
                </div>

                {/* Preview List */}
                <div className="rounded-lg border divide-y max-h-[350px] overflow-y-auto">
                  {parsedData.map((item, index) => (
                    <div key={index} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Status Indicator */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.error
                              ? "bg-destructive"
                              : item.isDuplicate
                                ? "bg-muted-foreground/40"
                                : "bg-green-500"
                          }`}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.label || (
                              <span className="text-muted-foreground italic font-normal">
                                No label
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-normal ml-2">
                              weight: {item.weight}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {item.recipient || "No address"}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {item.error && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-destructive/10 text-destructive"
                            >
                              Error
                            </Badge>
                          )}
                          {item.isDuplicate && !item.error && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] text-muted-foreground"
                            >
                              Duplicate
                            </Badge>
                          )}
                          {!item.error && !item.isDuplicate && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            >
                              New
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Error message */}
                      {item.error && (
                        <p className="text-xs text-destructive mt-2 ml-5">
                          {item.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={validCount === 0}
          >
            Import{" "}
            {validCount > 0
              ? `${validCount} Allocation${validCount !== 1 ? "s" : ""}`
              : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
