# Design Principles

Project-specific UI/UX patterns. Follow these when building or redesigning pages.

## Stack

- **Framework**: Next.js (App Router, `"use client"` components)
- **Components**: Shadcn UI via `@ethereum-canonical-registry/ui/components/*`
- **Styling**: Tailwind CSS v4, OKLCH color tokens, `cn()` utility
- **Fonts**: Geist (sans), Geist Mono (mono) — do not change
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Async state**: React Query (via SDK hooks)

## Layout Philosophy

**Open layouts over card stacking.** Pages should feel spacious and editorial, not like a grid of identical boxes. Use cards sparingly for contained data groups — prefer section-based layouts with headings and bordered containers.

### Page Structure

Every detail page follows this pattern:

1. **Back navigation** — subtle `text-muted-foreground` link with arrow icon at the top
2. **Hero section** — asymmetric grid (`grid-cols-1 lg:grid-cols-5`) with `border-b` separator
   - Left column (`lg:col-span-3`): identity/context — title, metadata, description
   - Right column (`lg:col-span-2`): financial data + primary actions
3. **Content sections** — each uses `<section className="space-y-5">` with:
   - A heading row: `text-lg font-semibold tracking-tight` + optional badge/count
   - Content in `rounded-lg border` containers (not Card components)
4. **Generous spacing** between sections: `space-y-12` on the page wrapper

### Skeleton States

Match the skeleton to the actual layout grid. Use the same `grid-cols` and `col-span` values. Skeletons should hint at the shape of real content — varying widths for titles vs metadata vs numbers.

### Empty States

Centered within a `rounded-lg border py-12` container. Include:

- A muted icon in a circular `bg-muted` container
- A short heading (`text-sm font-medium text-muted-foreground`)
- A one-line description (`text-xs text-muted-foreground`)
- Optional action button below

## Visual Hierarchy

### Typography Scale

| Element           | Classes                                                      |
| ----------------- | ------------------------------------------------------------ |
| Page title        | `text-3xl md:text-4xl font-bold tracking-tight`              |
| Financial numbers | `text-4xl font-bold tracking-tight tabular-nums`             |
| Section headings  | `text-lg font-semibold tracking-tight`                       |
| Stat labels       | `text-xs uppercase tracking-wider font-medium` (with icon)   |
| Inline labels     | `text-[11px] uppercase tracking-wider text-muted-foreground` |
| Body text         | `text-sm`                                                    |
| Metadata          | `text-xs text-muted-foreground`                              |
| Monospace values  | `font-mono text-xs` (addresses, hashes)                      |

### Button Hierarchy

- **Primary actions** (Fund, Distribute): default `<Button>` with icon, placed near the data they affect
- **Secondary actions** (Edit, Fork): `variant="ghost" size="sm"` with icon — subtle, near the title
- **Tertiary actions** (Connect Vault): `variant="outline" size="sm"` with icon
- **Destructive/state actions** (Harvest): `variant="default" size="sm"` with icon

Actions should be **near the data they affect**. Financial actions (Fund, Distribute) sit alongside financial stats. Management actions (Edit) sit alongside the title. Per-item actions (Harvest, Deposit) sit in the item's header row.

## Component Patterns

### Section Layout (replaces Card wrappers)

```tsx
<section className="space-y-5">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold tracking-tight">Section Title</h2>
    <Badge variant="secondary" className="text-xs">
      Count
    </Badge>
  </div>
  {/* Content in bordered container */}
  <div className="rounded-lg border divide-y">
    {items.map((item) => (
      <div key={item.id} className="px-4 py-3">
        ...
      </div>
    ))}
  </div>
</section>
```

### Hero Split Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 pb-10 border-b">
  <div className="lg:col-span-3">
    {/* Identity: title, metadata, description */}
  </div>
  <div className="lg:col-span-2">{/* Stats + primary actions */}</div>
</div>
```

### Stat Block

```tsx
<div className="space-y-1">
  <div className="flex items-center gap-2 text-muted-foreground">
    <Icon className="w-3.5 h-3.5" />
    <span className="text-xs uppercase tracking-wider font-medium">Label</span>
  </div>
  <p className="text-4xl font-bold tracking-tight tabular-nums">
    <FormattedValue />
  </p>
  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
    {/* Token breakdowns */}
  </div>
</div>
```

### Data Row (inside bordered containers)

```tsx
<div className="px-4 py-3">
  <div className="flex items-center gap-3">
    <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-blue-500" />
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate">Label</p>
      <p className="text-xs text-muted-foreground font-mono">0x1234...5678</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-sm font-semibold tabular-nums">Value</p>
      <p className="text-xs text-muted-foreground">Secondary</p>
    </div>
  </div>
</div>
```

### Table Section

```tsx
<div className="rounded-lg border overflow-hidden">
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</div>
```

### Metadata Badges

For addresses, counts, and inline metadata:

```tsx
<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
  <Badge variant="outline" className="font-mono text-xs">
    <EnsName address={address} />
  </Badge>
  <span>
    Curated by <span className="text-foreground font-medium">Name</span>
  </span>
  <span className="inline-flex items-center gap-1">
    <Icon className="w-3 h-3" /> 5 donors
  </span>
</div>
```

## Responsive Behavior

- Hero grid collapses to single column on mobile (`grid-cols-1 lg:grid-cols-5`)
- Stats stack below identity on mobile — this is intentional (context before numbers)
- Use `hidden sm:flex` for desktop-only elements and `flex sm:hidden` for mobile alternatives
- Vault stats grid: `grid-cols-2 md:grid-cols-4 divide-x`
- Wrap metadata items with `flex-wrap` and appropriate gap values

## Dialogs

All transactional dialogs (Fund, Distribute, Deposit, Connect Vault, Register ENS) follow Shadcn `Dialog` patterns:

- `DialogHeader` with `DialogTitle` + `DialogDescription`
- Form body in `<form onSubmit={handleSubmit(onSubmit)}>` using React Hook Form
- `DialogFooter` with a single submit `Button` (loading state via `isLoading`)
- Error display via `Alert variant="destructive"`

Dialogs are triggered by buttons placed according to the button hierarchy above. They are self-contained components that manage their own open/close state.

## Do Not

- Nest Card components inside other Card components
- Use `<Separator />` between major page sections — use `border-b` on the hero or `space-y-12` gap instead
- Stack more than 2 Card components in a row — break it up with section headings
- Put all action buttons in one place — distribute them near their related data
- Use `space-y-8` or less for page-level section spacing — use `space-y-12` for breathing room
- Use `text-3xl` for financial numbers — go bigger with `text-4xl` for impact
