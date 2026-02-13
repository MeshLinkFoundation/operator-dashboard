import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NodeHealthBadge } from "./node-health-badge";
import { Users, DollarSign, Activity } from "lucide-react";
import type { NodeSummary } from "@shared/types";

interface NodeCardProps {
  node: NodeSummary;
}

export function NodeCard({ node }: NodeCardProps) {
  return (
    <Link href={`/nodes/${node.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">{node.name}</CardTitle>
          <NodeHealthBadge status={node.status} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{node.clientCount}</p>
                <p className="text-xs text-muted-foreground">Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">
                  {node.activeSessionCount}
                </p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">
                  ${node.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </div>
          {node.error && (
            <p className="text-xs text-destructive mt-2">{node.error}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
