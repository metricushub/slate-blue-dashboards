import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "destructive";
}

export function KPICard({ title, value, icon, color }: KPICardProps) {
  const colorClasses = {
    primary: "text-primary bg-primary-light",
    success: "text-success bg-success-light", 
    warning: "text-warning bg-warning-light",
    destructive: "text-destructive bg-destructive-light",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className={cn("text-2xl font-bold", `text-${color}`)}>
              {value}
            </p>
          </div>
          <div className={cn("p-3 rounded-lg", colorClasses[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}