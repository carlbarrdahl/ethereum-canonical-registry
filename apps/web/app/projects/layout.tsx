import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Projects",
    template: "%s | support.eth curator",
  },
  description:
    "Browse projects receiving allocations across funding strategies.",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
