import type { Metadata } from "next";
import { CreateStrategyForm } from "./form";

export const metadata: Metadata = {
  title: "Create Strategy",
  description:
    "Create a new capital allocation strategy for public goods funding. Define allocations, set up yield vaults, and start supporting impactful projects.",
  openGraph: {
    title: "Create a Funding Strategy",
    description:
      "Design your own capital allocation strategy for public goods funding.",
  },
};

export default function CreateStrategyPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceStrategy?: string }>;
}) {
  return <CreateStrategyForm mode="create" searchParams={searchParams} />;
}
