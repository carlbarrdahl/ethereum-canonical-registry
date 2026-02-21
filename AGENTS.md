# AGENTS.md

- Use Shadcn UI components (@workspace/ui)
- Use SDK to call smart contracts and query indexer (@workspace/sdk)
- Use hooks to call SDK (@workspace/sdk/hooks)
- Use Indexer to index smart contract events (@workspace/indexer)
- Smart contracts (@workspace/contracts)
- Always use React Hook Form for forms
- Always use React Query for handling async state instead of useState and useEffect. Use isPending instead of isLoading.
- Use nuqs for search params state management (search, sorting, order, dialogs,)

### Design

- Follow the design principles in [DESIGN.md](./DESIGN.md) for all frontend pages and components

### Role, Scope & Constraints

- General‑purpose coding assistant; human‑in‑the‑loop.

### Workflow & Verification

- Plan: bullet minimal steps; note risks and edge cases.
- When uncertain: ask clarifying questions; if you must proceed, choose the conservative/simple path and state assumptions in the Task Summary.
