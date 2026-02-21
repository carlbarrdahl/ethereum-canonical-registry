"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useAccount, useEnsName, useChainId } from "wagmi";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { isAddress, zeroAddress, type Address } from "viem";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  ArrowLeftIcon,
  Loader2Icon,
  TrashIcon,
  UserIcon,
  LayersIcon,
  CheckCircleIcon,
  XCircleIcon,
  GitForkIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";

import { AllocationPieChart } from "@/components/allocation-pie-chart";
import { AddDestinationDialog } from "./add-destination-dialog";
import { ImportAllocationsDialog } from "./import-allocations-dialog";
import { ForkStrategyDialog } from "./fork-strategy-dialog";
import { getClientAllocationsWithWeights } from "./client-diversity-config";

import {
  useCreateStrategy,
  useRebalanceStrategy,
  useStrategyById,
  useStrategies,
  useENSAvailable,
  ENS_DOMAIN,
} from "@workspace/sdk";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@workspace/ui/components/input-group";
import { Markdown } from "@/components/markdown";

// Match pie chart colors for allocation row indicators
const ROW_COLORS = [
  "bg-blue-400",
  "bg-green-400",
  "bg-pink-400",
  "bg-yellow-400",
  "bg-purple-400",
  "bg-orange-400",
];

type FormValues = {
  name: string;
  description: string;
  allocations: { recipient: string; weight: number; label?: string }[];
  ensLabel?: string;
};

type EditModeProps = {
  mode: "edit";
  strategyAddress: Address;
  strategy: {
    owner: Address;
    ensLabel?: string | null;
    allocations: {
      recipient: Address;
      weight: string;
      label?: string | null;
    }[];
    metadata?: { title?: string; description?: string } | null;
  };
};

type CreateModeProps = {
  mode: "create";
  searchParams: Promise<{ sourceStrategy?: string }>;
};

type FormProps = EditModeProps | CreateModeProps;

const getDefaultCreateValues = (address?: Address): FormValues => ({
  name: "",
  description: "",
  allocations: [
    {
      recipient: address as Address,
      weight: 2,
      label: "Curator Fee",
    },
  ],
  ensLabel: "",
});

export function CreateStrategyForm(props: FormProps) {
  const router = useRouter();
  const { address } = useAccount();

  const searchParams = props.mode === "create" ? use(props.searchParams) : null;
  const sourceStrategy = searchParams?.sourceStrategy;

  const { data: sourceData, isLoading: isLoadingSource } = useStrategyById(
    sourceStrategy as Address,
    { enabled: Boolean(sourceStrategy && isAddress(sourceStrategy)) },
  );

  const getDefaultValues = (): FormValues => {
    if (props.mode === "edit") {
      return {
        name: props.strategy.metadata?.title || "",
        description: props.strategy.metadata?.description || "",
        allocations: props.strategy.allocations.map((a) => ({
          recipient: a.recipient,
          weight: Number(a.weight),
          label: a.label || "",
        })),
        ensLabel: props.strategy.ensLabel || "",
      };
    }
    return getDefaultCreateValues(address);
  };

  const form = useForm<FormValues>({
    defaultValues: getDefaultValues(),
  });

  // Resolve connected wallet's ENS name for default ensLabel
  const chainId = useChainId();
  const { data: walletEnsName } = useEnsName({
    address,
    chainId,
    query: { enabled: Boolean(address) },
  });

  useEffect(() => {
    if (address && props.mode === "create") {
      const allocations = form.getValues("allocations");
      // Find curator fee allocation (typically at index 0)
      const curatorFeeIndex = allocations.findIndex(
        (a) => a.label === "Curator Fee",
      );

      if (curatorFeeIndex !== -1) {
        // Curator fee always goes to the current curator (connected wallet)
        // This ensures only one curator fee per strategy
        form.setValue(`allocations.${curatorFeeIndex}.recipient`, address);
      }
    }
  }, [address, form, props.mode]);

  // Default ensLabel to connected wallet's ENS name
  useEffect(() => {
    if (
      walletEnsName &&
      props.mode === "create" &&
      !form.getValues("ensLabel")
    ) {
      // Extract the first label from the ENS name (e.g. "carl.eth" → "carl")
      const label = walletEnsName.split(".")[0];
      if (label) {
        form.setValue("ensLabel", label);
      }
    }
  }, [walletEnsName, form, props.mode]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allocations",
  });

  const { data: strategiesData } = useStrategies();
  const strategies = strategiesData?.items ?? [];

  const handleDismissFork = () => {
    // Reset form to default values with only curator fee
    form.reset(getDefaultCreateValues(address));
    // Navigate to clean URL without sourceStrategy param
    router.push("/strategies/create");
  };

  const ensLabel = form.watch("ensLabel");
  const isValidEnsLabel = useMemo(() => {
    return Boolean(
      ensLabel && ensLabel.trim().length > 0 && !isAddress(ensLabel),
    );
  }, [ensLabel]);

  const fullEnsName = useMemo(() => {
    if (!ensLabel || !isValidEnsLabel) return "";
    return `${ensLabel.trim()}.${ENS_DOMAIN}`;
  }, [ensLabel, isValidEnsLabel]);

  const { data: isAvailable, isLoading: isCheckingEns } = useENSAvailable(
    ensLabel?.trim() ?? "",
    { enabled: isValidEnsLabel && props.mode === "create" },
  );

  const ensAvailability = useMemo(() => {
    if (props.mode === "edit") return null; // Don't check availability in edit mode
    if (!isValidEnsLabel || !ensLabel) return null;
    if (isCheckingEns) return "checking";
    if (isAvailable === true) return "available";
    if (isAvailable === false) return "taken";
    return null;
  }, [props.mode, isValidEnsLabel, ensLabel, isCheckingEns, isAvailable]);

  const handleSelectRecipient = (recipient: string, label?: string) => {
    const isDuplicate = allocations.some(
      (allocation) =>
        allocation.recipient.toLowerCase() === recipient.toLowerCase(),
    );

    if (isDuplicate) {
      toast.error("This address is already in your allocations");
      return;
    }

    append({ recipient, weight: 100, label: label || "" });
  };

  useEffect(() => {
    if (sourceData && address) {
      // When forking: replace original curator fee with new curator's address
      // This follows a "rent" model - only the current curator receives the fee
      const allAllocations = sourceData.allocations.map((a) => ({
        recipient: a.label === "Curator Fee" ? address : a.recipient,
        weight: Number(a.weight),
        label: a.label ?? "",
      }));

      form.reset({
        name: sourceData.metadata?.title
          ? `${sourceData.metadata.title} (Fork)`
          : "",
        description: sourceData.metadata?.description ?? "",
        allocations: allAllocations,
      });
    }
  }, [sourceData, address, form]);

  const { mutateAsync: createStrategy, isPending: isCreating } =
    useCreateStrategy({
      onSuccess: ({ strategy }) => {
        toast.success("Strategy created successfully");
        router.push(`/strategies/${strategy}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create strategy");
      },
    });

  const { mutateAsync: rebalanceStrategy, isPending: isRebalancing } =
    useRebalanceStrategy({
      onSuccess: () => {
        toast.success("Strategy updated successfully");
        router.push(
          `/strategies/${props.mode === "edit" ? props.strategyAddress : ""}`,
        );
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update strategy");
      },
    });

  const isPending = props.mode === "edit" ? isRebalancing : isCreating;

  const allocations = form.watch("allocations");
  const totalWeight = allocations.reduce((sum, a) => sum + (a.weight || 0), 0);
  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");

  async function onSubmit(data: FormValues) {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (totalWeight === 0) {
      toast.error("Total allocation weight must be greater than 0");
      return;
    }

    const validAllocations = data.allocations.filter(
      (a) => a.recipient && isAddress(a.recipient),
    );

    if (validAllocations.length === 0) {
      toast.error("At least one valid allocation is required");
      return;
    }

    const metadata = {
      title: data.name,
      description: data.description,
    };

    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    });
    const metadataFile = new File([metadataBlob], "metadata.json", {
      type: "application/json",
    });

    const { url: metadataURI } = await upload(metadataFile.name, metadataFile, {
      access: "public",
      handleUploadUrl: "/api/upload",
    });

    const finalAllocations = validAllocations.map((a) => ({
      recipient: a.recipient as Address,
      weight: BigInt(a.weight),
      label: a.label ?? "",
    }));

    if (props.mode === "edit") {
      await rebalanceStrategy({
        strategyAddress: props.strategyAddress,
        allocations: finalAllocations,
        metadataURI,
      });
    } else {
      await createStrategy({
        owner: address,
        sourceStrategy: (sourceStrategy as Address) || zeroAddress,
        allocations: finalAllocations,
        metadataURI,
        ensLabel: data.ensLabel ?? "",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="px-6 py-8 space-y-12"
      >
        {/* Header */}
        <div className="space-y-4">
          <Link
            href={
              props.mode === "edit"
                ? `/strategies/${props.strategyAddress}`
                : "/"
            }
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
          </Link>
          <div className="flex items-center gap-3">
            {sourceStrategy && (
              <Badge variant="outline" className="gap-1">
                <GitForkIcon className="w-3 h-3" />
                Fork
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {props.mode === "edit"
                ? "Edit Strategy"
                : sourceStrategy
                  ? "Fork Strategy"
                  : "Create Strategy"}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl">
            {props.mode === "edit"
              ? "Update your strategy's allocations and metadata."
              : "Define how funds should be distributed across recipients. Each allocation's share is its weight divided by the total weight."}
          </p>
        </div>

        {/* Fork Strategy Selector - only in create mode */}
        {props.mode === "create" && !sourceStrategy && (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium">
                  Start from an existing strategy
                </p>
                <p className="text-xs text-muted-foreground">
                  Fork a strategy to use it as a starting point for your
                  allocations
                </p>
              </div>
              <ForkStrategyDialog
                strategies={strategies}
                currentSourceStrategy={sourceStrategy}
              />
            </div>
          </div>
        )}

        {/* Loading source strategy */}
        {sourceStrategy && isLoadingSource && (
          <div className="rounded-lg border py-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2Icon className="w-4 h-4 animate-spin" />
            Loading source strategy...
          </div>
        )}

        {/* Source strategy banner - dismissible */}
        {sourceData && props.mode === "create" && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <GitForkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 text-sm">
                  <span className="text-muted-foreground">Forking: </span>
                  <Link
                    href={`/strategies/${sourceStrategy}`}
                    className="font-medium text-foreground hover:underline truncate inline-block max-w-[200px] align-bottom"
                  >
                    {sourceData.metadata?.title || sourceData.id}
                  </Link>
                  <span className="text-muted-foreground"> • </span>
                  <Link
                    href={`/strategies/${sourceStrategy}`}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    View original
                  </Link>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismissFork}
                className="shrink-0"
              >
                <XIcon className="w-4 h-4 mr-1.5" />
                Start fresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: The curator fee now goes to you as the new curator. Original
              allocations are preserved.
            </p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Strategy Details */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Strategy Details
              </h2>
              <div className="rounded-lg border p-5 space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ethereum Core Infrastructure"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ensLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        ENS Name{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <InputGroup>
                            <InputGroupInput
                              placeholder=""
                              disabled={props.mode === "edit"}
                              className="pr-10"
                              {...field}
                            />
                            <InputGroupAddon
                              className="pr-8"
                              align="inline-end"
                            >
                              <InputGroupText>.{ENS_DOMAIN}</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                          {props.mode === "create" &&
                            ensAvailability === "available" && (
                              <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                            )}
                          {props.mode === "create" &&
                            ensAvailability === "taken" && (
                              <XCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                            )}
                          {props.mode === "create" &&
                            ensAvailability === "checking" && (
                              <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                      </FormControl>

                      {props.mode === "edit" && (
                        <p className="text-xs text-muted-foreground">
                          ENS name cannot be changed after creation
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your allocation strategy..."
                          rows={8}
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Allocations */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Allocations
                </h2>
                <p className="text-sm text-muted-foreground">
                  Set recipient addresses and weights. Share = weight / total.
                </p>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => {
                  const isCuratorFee =
                    index === 0 && allocations[0]?.label === "Curator Fee";
                  const currentRecipient = allocations[index]?.recipient;
                  const currentWeight = allocations[index]?.weight || 0;
                  const percent =
                    totalWeight > 0
                      ? ((currentWeight / totalWeight) * 100).toFixed(1)
                      : "0";
                  const isStrategy = strategies.some(
                    (s) =>
                      s.id.toLowerCase() === currentRecipient?.toLowerCase(),
                  );
                  const strategyData = strategies.find(
                    (s) =>
                      s.id.toLowerCase() === currentRecipient?.toLowerCase(),
                  );
                  const colorClass = ROW_COLORS[index % ROW_COLORS.length];

                  return (
                    <div
                      key={field.id}
                      className={`group rounded-lg border px-4 py-3 transition-colors ${
                        isCuratorFee
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                          : isStrategy
                            ? "border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/10"
                            : "border-border hover:border-muted-foreground/25"
                      }`}
                    >
                      {/* Row top: color dot + label + type badge + percentage */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorClass}`}
                        />
                        <FormField
                          control={form.control}
                          name={`allocations.${index}.label`}
                          render={({ field }) => (
                            <Input
                              placeholder={
                                isCuratorFee
                                  ? "Curator Fee"
                                  : isStrategy && strategyData?.metadata?.title
                                    ? strategyData.metadata.title
                                    : "Label"
                              }
                              className="h-7 text-sm font-medium border-none shadow-none px-1 bg-transparent focus-visible:ring-0"
                              {...field}
                            />
                          )}
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          {isCuratorFee && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            >
                              <WalletIcon className="h-2.5 w-2.5 mr-0.5" />
                              Fee
                            </Badge>
                          )}
                          {!isCuratorFee && isStrategy && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            >
                              <LayersIcon className="h-2.5 w-2.5 mr-0.5" />
                              Strategy
                            </Badge>
                          )}
                          {!isCuratorFee &&
                            !isStrategy &&
                            currentRecipient &&
                            isAddress(currentRecipient) && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                <UserIcon className="h-2.5 w-2.5 mr-0.5" />
                                Address
                              </Badge>
                            )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">
                                {percent}%
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {currentWeight} / {totalWeight} total weight
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Row bottom: address input + weight input + delete */}
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`allocations.${index}.recipient`}
                          rules={{
                            required: "Address required",
                            validate: (v) => isAddress(v) || "Invalid address",
                          }}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="0x..."
                                  className="font-mono "
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`allocations.${index}.weight`}
                          rules={{ required: true, min: 0 }}
                          render={({ field }) => (
                            <Input
                              type="number"
                              className="w-24 text-center tabular-nums "
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isCuratorFee}
                          onClick={() => remove(index)}
                          className="h-8 w-8 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!address && (
                <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center space-y-2">
                  <WalletIcon className="h-5 w-5 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Connect your wallet</p>
                    <p className="text-xs text-muted-foreground">
                      You need to connect your wallet to add recipients and
                      publish your strategy
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <AddDestinationDialog
                    strategies={strategies}
                    existingAddresses={allocations.map((a) => a.recipient)}
                    onSelect={handleSelectRecipient}
                    disabled={!address}
                  />
                </div>
                <ImportAllocationsDialog
                  existingAddresses={allocations.map((a) => a.recipient)}
                  onImport={(newAllocations) => {
                    newAllocations.forEach((alloc) => {
                      append({
                        recipient: alloc.recipient,
                        weight: alloc.weight,
                        label: alloc.label || "",
                      });
                    });
                  }}
                  disabled={!address}
                />
              </div>
            </section>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Live Preview */}
              <div className="rounded-lg border bg-muted/30 p-5 space-y-5">
                <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Live Preview
                </p>

                {/* Strategy name + description preview */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold tracking-tight truncate">
                    {watchedName || (
                      <span className="text-muted-foreground italic font-normal">
                        Untitled Strategy
                      </span>
                    )}
                  </h3>
                  {watchedDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-8 leading-relaxed">
                      <Markdown className="prose-sm text-muted-foreground!">
                        {watchedDescription}
                      </Markdown>
                    </p>
                  )}
                  {fullEnsName && ensAvailability === "available" && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {fullEnsName}
                    </p>
                  )}
                </div>

                {/* Pie Chart */}
                <div className="border-t pt-5">
                  <AllocationPieChart allocations={allocations} />
                </div>

                {/* Allocation summary list */}
                <div className="border-t pt-5 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Allocation Summary
                  </p>
                  {allocations
                    .slice()
                    .sort((a, b) => b.weight - a.weight)
                    .map((a, i) => {
                      const pct =
                        totalWeight > 0
                          ? ((a.weight / totalWeight) * 100).toFixed(1)
                          : "0";
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${ROW_COLORS[i % ROW_COLORS.length]}`}
                            />
                            <span className="truncate">
                              {a.label ||
                                (a.recipient && isAddress(a.recipient)
                                  ? `${a.recipient.slice(0, 6)}...${a.recipient.slice(-4)}`
                                  : "No address")}
                            </span>
                          </div>
                          <span className="tabular-nums text-muted-foreground shrink-0 ml-2">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Submit Section */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!address || isPending}
                  isLoading={isPending || form.formState.isSubmitting}
                >
                  {props.mode === "edit"
                    ? "Save Changes"
                    : sourceStrategy
                      ? "Fork Strategy"
                      : "Publish Strategy"}
                </Button>

                {!address && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect your wallet to publish
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
