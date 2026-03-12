import { ComponentProps } from "react";
import { Address } from "viem";
import { useChainId, useEnsAvatar, useEnsName } from "wagmi";
import { normalize } from "viem/ens";
import { truncate } from "@/lib/truncate";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ethereum-entity-registry/ui/components/avatar";
import deployments from "@ethereum-entity-registry/contracts/deployments.json";

function getUniversalResolverAddress(chainId: number): Address | undefined {
  const d = deployments[chainId as keyof typeof deployments] as
    | { UniversalResolver?: { address: string } }
    | undefined;
  return d?.UniversalResolver?.address as Address | undefined;
}

export function EnsName({
  address,
  length = 13,
}: {
  address?: Address;
  length?: number;
}) {
  const chainId = useChainId();
  const universalResolverAddress = getUniversalResolverAddress(chainId);
  const { data: name } = useEnsName({
    address,
    chainId,
    ...(universalResolverAddress && { universalResolverAddress }),
    query: { enabled: Boolean(address) },
  });
  return <span title={address}>{name ?? truncate(address, length)}</span>;
}

export function EnsAvatar({
  address,
  ...props
}: { address: string } & ComponentProps<typeof Avatar>) {
  const chainId = useChainId();
  const universalResolverAddress = getUniversalResolverAddress(chainId);
  const { data: name } = useEnsName({
    address: address as Address,
    chainId,
    ...(universalResolverAddress && { universalResolverAddress }),
    query: { enabled: Boolean(address) },
  });

  const { data: src } = useEnsAvatar({
    chainId,
    ...(universalResolverAddress && { universalResolverAddress }),
    name: normalize(name!),
    query: { enabled: Boolean(name) },
  });
  return (
    <Avatar {...props}>
      <AvatarImage src={src!} alt={name ?? address} />
      <AvatarFallback className="bg-gray-100 dark:bg-gray-800"></AvatarFallback>
    </Avatar>
  );
}
