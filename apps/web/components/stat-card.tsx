import { Card, CardContent } from "@ethereum-canonical-registry/ui/components/card";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <Card>
      <CardContent className="">
        <p className="text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {detail && (
          <div className="text-xs text-muted-foreground mt-1">{detail}</div>
        )}
      </CardContent>
    </Card>
  );
}
