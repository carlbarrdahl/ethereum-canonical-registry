import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Strategies",
    template: "%s | support.eth curator",
  },
  description:
    "Browse and manage capital allocation strategies for public goods funding.",
};

export default function StrategiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
