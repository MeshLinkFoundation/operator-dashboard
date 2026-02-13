import { useOverview } from "@/hooks/use-nodes";
import { StatCard } from "@/components/stat-card";
import { NodeCard } from "@/components/node-card";
import { RevenueChart } from "@/components/revenue-chart";
import { TierBreakdownChart } from "@/components/tier-breakdown-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, Activity, Radio } from "lucide-react";
import { Link } from "wouter";

export default function Overview() {
  const { data, isLoading, error } = useOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error.message}</p>
        {data === undefined && (
          <p className="text-sm text-muted-foreground mt-2">
            Add nodes in{" "}
            <Link href="/settings" className="underline">
              Settings
            </Link>{" "}
            to get started.
          </p>
        )}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={data.totalClients}
          icon={Users}
        />
        <StatCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Active Sessions"
          value={data.activeSessions}
          icon={Activity}
        />
        <StatCard
          title="Node Health"
          value={`${data.nodesOnline}/${data.nodesTotal}`}
          description={
            data.nodesOnline === data.nodesTotal
              ? "All nodes online"
              : `${data.nodesTotal - data.nodesOnline} unreachable`
          }
          icon={Radio}
        />
      </div>

      {/* Node grid */}
      {data.nodes.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Nodes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Radio className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No nodes configured</p>
          <Link href="/settings" className="text-sm text-primary underline mt-1 block">
            Add your first node
          </Link>
        </div>
      )}

      {/* Charts */}
      {data.nodes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart data={data.revenueByNode} />
          <TierBreakdownChart data={data.tierBreakdown} />
        </div>
      )}
    </div>
  );
}
