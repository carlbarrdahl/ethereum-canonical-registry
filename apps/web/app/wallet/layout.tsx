import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wallet",
  description:
    "View and claim your earnings from strategy distributions. Manage your claimable balances from the Splits Warehouse.",
  openGraph: {
    title: "My Wallet - support.eth curator",
    description:
      "Claim your earnings from public goods funding strategy distributions.",
  },
};

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
