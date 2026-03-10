"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { type Address, formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import {
  Github,
  Globe,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowDownToLine,
  WarehouseIcon,
} from "lucide-react";

import {
  useCanonicalRegistrySDK,
  getTokens,
  isNativeToken,
  parseUrl,
  canonicalise,
  type ParsedUrl,
  type IdentifierState,
} from "@ethereum-canonical-registry/sdk";

import { Button } from "@ethereum-canonical-registry/ui/components/button";
import { Input } from "@ethereum-canonical-registry/ui/components/input";
import { Badge } from "@ethereum-canonical-registry/ui/components/badge";
import { Alert, AlertDescription } from "@ethereum-canonical-registry/ui/components/alert";

import { SelectToken } from "@/components/select-token";
import { useTransfer } from "@/hooks/use-transfer";
import { useToken } from "@/hooks/use-token";

// ─── Input parsing ────────────────────────────────────────────────────────────
// Handles "org/repo" GitHub shorthand (no dot before the first slash → GitHub).
function parseInput(raw: string): ParsedUrl {
  const trimmed = raw.trim();
  const slashIdx = trimmed.indexOf("/");
  const hasScheme = /^https?:\/\//i.test(trimmed);

  if (
    !hasScheme &&
    slashIdx > 0 &&
    !trimmed.slice(0, slashIdx).includes(".")
  ) {
    const [owner, repo] = trimmed.split("/");
    if (owner && repo) {
      const cs = canonicalise(`${owner}/${repo}`);
      return { namespace: "github", canonicalString: cs, formatted: `github:${cs}` };
    }
  }

  return parseUrl(trimmed);
}

// ─── Quick-fill examples ─────────────────────────────────────────────────────
const EXAMPLES = [
  { label: "ethereum/go-ethereum", value: "github.com/ethereum/go-ethereum" },
  { label: "vitalik.ca", value: "vitalik.ca" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
type ResolveForm = { url: string };
type FundForm = { amount: string };

export default function Page() {
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const chainId = useChainId();
  const tokens = getTokens(chainId).filter((t) => !isNativeToken(t.address));
  const [selectedToken, setSelectedToken] = useState<Address | undefined>(
    tokens[0]?.address,
  );

  const { sdk } = useCanonicalRegistrySDK();
  const { address: account } = useAccount();

  const resolveForm = useForm<ResolveForm>();
  const fundForm = useForm<FundForm>();

  // ── Identifier state query ──────────────────────────────────────────────────
  const identifierQuery = useQuery({
    queryKey: ["identifier", parsed?.namespace, parsed?.canonicalString, selectedToken],
    queryFn: () =>
      sdk!.registry.resolveIdentifier(
        parsed!.namespace,
        parsed!.canonicalString,
        selectedToken!,
      ),
    enabled: !!sdk && !!parsed && !!selectedToken,
    retry: 1,
  });

  const state = identifierQuery.data;
  const selectedTokenConfig = tokens.find((t) => t.address === selectedToken);
  const transfer = useTransfer();
  const tokenInfo = useToken(selectedToken, account);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function onResolve({ url }: ResolveForm) {
    if (!url.trim()) return;
    try {
      const result = parseInput(url);
      setParsed(result);
      setParseError(null);
      fundForm.reset();
    } catch (e) {
      setParseError((e as Error).message);
      setParsed(null);
    }
  }

  function fillExample(value: string) {
    resolveForm.setValue("url", value);
    try {
      const result = parseInput(value);
      setParsed(result);
      setParseError(null);
      fundForm.reset();
    } catch (e) {
      setParseError((e as Error).message);
      setParsed(null);
    }
  }

  async function onFund({ amount }: FundForm) {
    if (!state?.depositAddress || !selectedToken) return;
    const decimals = tokenInfo.data?.decimals ?? 18;
    try {
      await transfer.transferAsync({
        token: selectedToken,
        to: state.depositAddress,
        amount: parseUnits(amount, decimals),
      });
      toast.success("Tokens sent");
      fundForm.reset();
      setTimeout(() => identifierQuery.refetch(), 3000);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
      {/* Hero */}
      <div className="space-y-3 text-center pt-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Fund any open-source project
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Enter a GitHub repository or web domain. Anyone can send tokens to its
          deposit address — the owner claims them when ready.
        </p>
      </div>

      {/* Resolve form */}
      <form onSubmit={resolveForm.handleSubmit(onResolve)} className="space-y-3">
        <div className="flex gap-2">
          <Input
            {...resolveForm.register("url", { required: true })}
            placeholder="github.com/org/repo  or  example.com"
            className="font-mono text-sm"
            autoFocus
          />
          <Button type="submit" className="shrink-0">
            Resolve
          </Button>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span className="text-xs text-muted-foreground">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.value}
              type="button"
              onClick={() => fillExample(ex.value)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </form>

      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {/* Resolved identifier card */}
      {parsed && (
        <div className="rounded-lg border divide-y">
          {/* Identifier header */}
          <div className="px-5 py-4 flex items-center gap-3">
            {parsed.namespace === "github" ? (
              <Github className="w-4 h-4 shrink-0 text-muted-foreground" />
            ) : (
              <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{parsed.canonicalString}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {parsed.formatted}
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {parsed.namespace}
            </Badge>
          </div>

          {/* Deposit address */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Deposit address
            </p>
            {identifierQuery.isPending ? (
              <div className="h-5 w-full max-w-sm bg-muted rounded animate-pulse" />
            ) : state ? (
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm flex-1 min-w-0 truncate">
                  {state.depositAddress}
                </p>
                <button
                  onClick={() => copyAddress(state.depositAddress)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy address"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Tokens sent here accumulate until the owner proves ownership and
              withdraws.
            </p>
          </div>

          {/* Owner */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Owner
            </p>
            {identifierQuery.isPending ? (
              <div className="h-5 w-1/2 bg-muted rounded animate-pulse" />
            ) : state ? (
              state.owner ? (
                <p className="font-mono text-sm break-all">{state.owner}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Unclaimed — funds are safe until the owner proves
                    ownership
                  </span>
                </div>
              )
            ) : null}
          </div>

          {/* Balance + fund form */}
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Balance at deposit address
              </p>
              <SelectToken
                value={selectedToken}
                onValueChange={(v) => {
                  setSelectedToken(v);
                  fundForm.reset();
                }}
                tokens={tokens}
              />
            </div>

            {identifierQuery.isPending ? (
              <div className="h-10 w-1/3 bg-muted rounded animate-pulse" />
            ) : state ? (
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                {formatUnits(
                  state.balance,
                  selectedTokenConfig?.decimals ?? 18,
                )}{" "}
                <span className="text-xl font-medium text-muted-foreground">
                  {selectedTokenConfig?.symbol}
                </span>
              </p>
            ) : null}

            {/* Send form */}
            <form
              onSubmit={fundForm.handleSubmit(onFund)}
              className="flex gap-2 items-start pt-1"
            >
              <div className="flex-1 space-y-1">
                <Input
                  {...fundForm.register("amount", {
                    required: "Amount required",
                    validate: (v) => {
                      const n = parseFloat(v);
                      if (isNaN(n) || n <= 0) return "Enter a positive amount";
                      return true;
                    },
                  })}
                  placeholder="0.00"
                  className="font-mono"
                  type="number"
                  step="any"
                  min="0"
                />
                {account && tokenInfo.data?.formatted !== null && (
                  <p className="text-xs text-muted-foreground">
                    Your balance: {tokenInfo.data?.formatted ?? "—"}{" "}
                    {tokenInfo.data?.symbol}
                  </p>
                )}
                {fundForm.formState.errors.amount && (
                  <p className="text-xs text-destructive">
                    {fundForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                isLoading={transfer.isPending}
                disabled={!account || !state}
                className="shrink-0"
              >
                {!account ? "Connect wallet" : "Send"}
              </Button>
            </form>
          </div>

          {/* Owner actions — only when the connected wallet is the owner */}
          {state?.owner && account && state.owner.toLowerCase() === account.toLowerCase() && (
            <ExecuteActions
              state={state}
              token={selectedToken!}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Execute actions ──────────────────────────────────────────────────────────
function ExecuteActions({
  state,
  token,
}: {
  state: IdentifierState;
  token: Address;
}) {
  const { sdk } = useCanonicalRegistrySDK();
  const { address: account } = useAccount();
  const [pending, setPending] = useState<string | null>(null);

  const withdrawForm = useForm<{ recipient: string }>();
  const warehouseForm = useForm<{ warehouseAddress: string }>();

  async function handleWithdrawTokens({ recipient }: { recipient: string }) {
    if (!sdk || !state.balance || state.balance === 0n) return;
    setPending("withdraw");
    try {
      const to = (recipient.trim() || account!) as Address;
      const { target, data } = sdk.account.encodeERC20Transfer(token, to, state.balance);
      await sdk.account.execute(state.depositAddress, target, data);
      toast.success("Tokens withdrawn");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  async function handleWarehouseWithdraw({ warehouseAddress }: { warehouseAddress: string }) {
    if (!sdk || !warehouseAddress.trim()) return;
    setPending("warehouse");
    try {
      const { target, data } = sdk.account.encodeWarehouseWithdraw(
        warehouseAddress.trim() as Address,
        state.depositAddress,
        token,
      );
      await sdk.account.execute(state.depositAddress, target, data);
      toast.success("Warehouse withdrawal complete");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="px-5 py-4 space-y-5">
      <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
        Owner Actions
      </p>

      {/* Withdraw ERC-20 balance */}
      <form
        onSubmit={withdrawForm.handleSubmit(handleWithdrawTokens)}
        className="space-y-2"
      >
        <div className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <Input
              {...withdrawForm.register("recipient")}
              placeholder={`Recipient (default: your wallet)`}
              className="font-mono text-sm"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={!state.balance || state.balance === 0n || pending !== null}
            isLoading={pending === "withdraw"}
          >
            <ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />
            Withdraw tokens
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Transfer the full token balance from this identity account to a recipient.
        </p>
      </form>

      {/* Warehouse withdraw */}
      <form
        onSubmit={warehouseForm.handleSubmit(handleWarehouseWithdraw)}
        className="space-y-2"
      >
        <div className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <Input
              {...warehouseForm.register("warehouseAddress", { required: "Warehouse address required" })}
              placeholder="Splits Warehouse address"
              className="font-mono text-sm"
            />
            {warehouseForm.formState.errors.warehouseAddress && (
              <p className="text-xs text-destructive">
                {warehouseForm.formState.errors.warehouseAddress.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={pending !== null}
            isLoading={pending === "warehouse"}
          >
            <WarehouseIcon className="w-3.5 h-3.5 mr-1.5" />
            Warehouse withdraw
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pull tokens owed to this identity account from a Splits Warehouse.
        </p>
      </form>
    </div>
  );
}
