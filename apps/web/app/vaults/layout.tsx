import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Yield Vaults",
    template: "%s | support.eth curator",
  },
  description:
    "Manage yield-generating vaults that redirect earnings to public goods strategies.",
};

export default function VaultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
