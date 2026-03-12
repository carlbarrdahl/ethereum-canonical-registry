import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wallet",
  description:
    "View your claimed identifiers and manage your identity accounts.",
  openGraph: {
    title: "My Wallet - Entity Registry",
    description:
      "View your claimed identifiers and manage your identity accounts.",
  },
};

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
