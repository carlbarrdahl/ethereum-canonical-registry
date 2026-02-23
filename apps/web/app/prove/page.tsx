"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import {
  Globe,
  Github,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lock,
  LogOut,
  Search,
  Link,
} from "lucide-react";

import { useCanonicalRegistrySDK, useClaim } from "@ethereum-canonical-registry/sdk";
import deployments from "@ethereum-canonical-registry/contracts/deployments.json";

import { Button } from "@ethereum-canonical-registry/ui/components/button";
import { Input } from "@ethereum-canonical-registry/ui/components/input";
import { Label } from "@ethereum-canonical-registry/ui/components/label";
import { Alert, AlertDescription } from "@ethereum-canonical-registry/ui/components/alert";
import { Badge } from "@ethereum-canonical-registry/ui/components/badge";
import { cn } from "@ethereum-canonical-registry/ui/lib/utils";

type DnsForm = { domain: string };

type GithubRepo = {
  owner: string;
  repo: string;
  fullName: string;
  private: boolean;
};
type GithubUser = { login: string; avatarUrl: string };

function ProofResult({
  proof,
  namespace,
  canonicalString,
}: {
  proof: string;
  namespace: string;
  canonicalString: string;
}) {
  const [copied, setCopied] = useState(false);
  const claim = useClaim();

  // proof is 0x-prefixed hex; each byte = 2 hex chars
  const byteLength = (proof.length - 2) / 2;

  function copyProof() {
    navigator.clipboard.writeText(proof);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span className="text-sm font-medium">Proof generated</span>
        <Badge variant="secondary" className="text-xs font-mono ml-auto">
          {namespace}:{canonicalString}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 rounded border bg-background px-3 py-2 font-mono text-xs text-muted-foreground truncate">
          {proof}
        </code>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={copyProof}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        ABI-encoded · {byteLength} bytes · first 64 bytes are offset + expiry
        header
      </p>

      <Button
        className="w-full"
        size="sm"
        onClick={() =>
          claim.mutate({
            namespace,
            canonicalString,
            proof: proof as `0x${string}`,
          })
        }
        disabled={claim.isPending}
      >
        {claim.isPending ? "Submitting…" : "Claim on-chain"}
        {!claim.isPending && <ArrowRight className="w-3.5 h-3.5 ml-2" />}
      </Button>

      {claim.isError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <AlertDescription className="text-xs">
            {claim.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function useRegistryAddress() {
  const { sdk } = useCanonicalRegistrySDK();
  const chainId = useChainId();
  const effectiveChainId = (
    sdk?.chainId ?? chainId
  ).toString() as keyof typeof deployments;
  const d = deployments[effectiveChainId];
  return d
    ? (d as { CanonicalRegistry: { address: string } }).CanonicalRegistry
        .address
    : null;
}

export default function ProvePage() {
  const { address: account } = useAccount();
  const chainId = useChainId();
  const registryAddress = useRegistryAddress();
  const queryClient = useQueryClient();

  const [dnsProof, setDnsProof] = useState<{
    proof: string;
    canonicalString: string;
  } | null>(null);
  const [githubProof, setGithubProof] = useState<{
    proof: string;
    canonicalString: string;
  } | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [repoSearch, setRepoSearch] = useState("");

  const dnsForm = useForm<DnsForm>();
  const dnsDomain = useWatch({ control: dnsForm.control, name: "domain" });

  const dnsMutation = useMutation({
    mutationFn: async ({ domain }: DnsForm) => {
      if (!account) throw new Error("Connect your wallet first");
      if (!registryAddress)
        throw new Error("Registry not deployed on this chain");

      const res = await fetch("/api/proof/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          claimant: account,
          registryAddress,
          chainId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate proof");
      return {
        proof: data.proof as string,
        canonicalString: domain.toLowerCase().replace(/\.$/, ""),
      };
    },
    onSuccess: (data) => setDnsProof(data),
  });

  const githubReposQuery = useQuery<{ user: GithubUser; repos: GithubRepo[] }>({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const res = await fetch("/api/proof/github/repos");
      if (res.status === 401) throw new Error("unauthenticated");
      if (!res.ok) throw new Error("Failed to load repos");
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const disconnectMutation = useMutation({
    mutationFn: () => fetch("/api/auth/github", { method: "DELETE" }),
    onSuccess: () => {
      setSelectedRepo(null);
      setGithubProof(null);
      queryClient.removeQueries({ queryKey: ["github-repos"] });
    },
  });

  const githubMutation = useMutation({
    mutationFn: async ({ owner, repo }: { owner: string; repo: string }) => {
      if (!account) throw new Error("Connect your wallet first");
      if (!registryAddress)
        throw new Error("Registry not deployed on this chain");

      const res = await fetch("/api/proof/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          claimant: account,
          registryAddress,
          chainId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate proof");
      return {
        proof: data.proof as string,
        canonicalString: `${owner.toLowerCase()}/${repo.toLowerCase()}`,
      };
    },
    onSuccess: (data) => setGithubProof(data),
  });

  const isGithubConnected =
    githubReposQuery.isSuccess && !githubReposQuery.isError;

  const filteredRepos = (githubReposQuery.data?.repos ?? []).filter((r) =>
    r.fullName.toLowerCase().includes(repoSearch.toLowerCase()),
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-12">
      {/* Hero */}
      <div className="space-y-3 pb-10 border-b">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Prove ownership
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Generate a signed proof that you control a domain or GitHub
          repository, then submit it on-chain to claim the canonical identifier.
        </p>
        {!account && (
          <Alert className="mt-4 max-w-lg">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Connect your wallet to generate proofs.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* DNS section */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md border bg-muted">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              DNS ownership
            </h2>
            <p className="text-xs text-muted-foreground">
              Add a{" "}
              <code className="font-mono">_eth-canonical.&lt;domain&gt;</code>{" "}
              TXT record with your address
            </p>
          </div>
        </div>

        <div className="rounded-lg border divide-y">
          <div className="px-4 py-4">
            <div className="rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground space-y-1 mb-4">
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                Required DNS record
              </p>
                <p>
                  <span className="text-foreground">Host:</span>{" "}
                  _eth-canonical.{dnsDomain || "example.com"}
                </p>
              <p>
                <span className="text-foreground">Type:</span> TXT
              </p>
              <p>
                <span className="text-foreground">Value:</span>{" "}
                <span className={cn(!account && "text-muted-foreground/50")}>
                  {account ?? "0xYourAddress"}
                </span>
              </p>
            </div>

            <form
              onSubmit={dnsForm.handleSubmit((data) => {
                setDnsProof(null);
                dnsMutation.mutate(data);
              })}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="dns-domain" className="text-xs">
                  Domain
                </Label>
                <Input
                  id="dns-domain"
                  placeholder="example.com"
                  {...dnsForm.register("domain", { required: true })}
                />
              </div>

              <Button
                type="submit"
                disabled={dnsMutation.isPending || !account}
                className="w-full sm:w-auto"
              >
                {dnsMutation.isPending ? "Checking DNS…" : "Generate proof"}
              </Button>

              {dnsMutation.isError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <AlertDescription className="text-xs">
                    {dnsMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </div>

          {dnsProof && (
            <div className="px-4 py-4">
              <ProofResult
                proof={dnsProof.proof}
                namespace="dns"
                canonicalString={dnsProof.canonicalString}
              />
            </div>
          )}
        </div>
      </section>

      {/* GitHub section */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md border bg-muted">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              GitHub ownership
            </h2>
            <p className="text-xs text-muted-foreground">
              Prove you are an admin of a GitHub repository
            </p>
          </div>
        </div>

        <div className="rounded-lg border divide-y">
          {/* Connect / identity bar */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            {githubReposQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">
                Checking GitHub connection…
              </p>
            ) : isGithubConnected ? (
              <>
                <div className="flex items-center gap-2">
                  {githubReposQuery.data?.user.avatarUrl && (
                    <img
                      src={githubReposQuery.data.user.avatarUrl}
                      alt=""
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium">
                    @{githubReposQuery.data?.user.login}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {githubReposQuery.data?.repos.length} admin repos
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Connect GitHub to see your repositories
                </p>
                <a href="/api/auth/github">
                  <Button icon={Lock}  variant="outline">
                    Connect with GitHub
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Repo selection */}
          {isGithubConnected && (
            <div className="px-4 py-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search repos…"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                {filteredRepos.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No admin repositories found
                  </p>
                ) : (
                  filteredRepos.map((r) => (
                    <button
                      key={r.fullName}
                      type="button"
                      onClick={() => {
                        setSelectedRepo(r);
                        setGithubProof(null);
                        githubMutation.reset();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors",
                        selectedRepo?.fullName === r.fullName && "bg-muted",
                      )}
                    >
                      <span className="font-mono text-xs">{r.fullName}</span>
                      {r.private && (
                        <Badge
                          variant="outline"
                          className="text-[10px] ml-2 shrink-0"
                        >
                          private
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>

              {selectedRepo && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Selected:</span>
                    <Badge variant="secondary" className="font-mono">
                      {selectedRepo.fullName}
                    </Badge>
                  </div>

                  <Button
                    onClick={() => {
                      setGithubProof(null);
                      githubMutation.mutate({
                        owner: selectedRepo.owner,
                        repo: selectedRepo.repo,
                      });
                    }}
                    disabled={githubMutation.isPending || !account}
                    className="w-full sm:w-auto"
                  >
                    {githubMutation.isPending
                      ? "Generating proof…"
                      : "Generate proof"}
                  </Button>

                  {githubMutation.isError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <AlertDescription className="text-xs">
                        {githubMutation.error.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {githubProof && (
            <div className="px-4 py-4">
              <ProofResult
                proof={githubProof.proof}
                namespace="github"
                canonicalString={githubProof.canonicalString}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
