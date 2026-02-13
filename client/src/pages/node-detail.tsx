import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useNodeClients,
  useNodeAnalytics,
  useNodeSessions,
  useDisconnectClient,
  useRevokeSession,
  useOverview,
} from "@/hooks/use-nodes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { NodeHealthBadge } from "@/components/node-health-badge";
import { ClientsTable } from "@/components/clients-table";
import { SessionsTable } from "@/components/sessions-table";
import { RevenueChart } from "@/components/revenue-chart";
import { TierBreakdownChart } from "@/components/tier-breakdown-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  DollarSign,
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function NodeDetail() {
  const [, params] = useRoute("/nodes/:id");
  const nodeId = params?.id || "";
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sessionOffset, setSessionOffset] = useState(0);

  const { data: overview } = useOverview();
  const nodeSummary = overview?.nodes.find((n) => n.id === nodeId);

  const {
    data: clientsData,
    isLoading: clientsLoading,
  } = useNodeClients(nodeId);

  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useNodeAnalytics(nodeId);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
  } = useNodeSessions(nodeId, {
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: PAGE_SIZE,
    offset: sessionOffset,
  });

  const disconnectMutation = useDisconnectClient(nodeId);
  const revokeMutation = useRevokeSession(nodeId);

  const handleDisconnect = async (ip: string) => {
    try {
      await disconnectMutation.mutateAsync(ip);
      toast({ title: `Disconnected ${ip}` });
    } catch (err: any) {
      toast({
        title: "Failed to disconnect",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeMutation.mutateAsync(sessionId);
      toast({ title: "Session revoked" });
    } catch (err: any) {
      toast({
        title: "Failed to revoke",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (!nodeId) return null;

  // Build tier breakdown for per-node chart
  const tierBreakdown = analytics?.tierStats
    ? Object.entries(analytics.tierStats).map(([, val]: [string, any]) => ({
        tier: val.name,
        count: val.count,
      }))
    : [];

  // Build revenue data for per-node chart
  const revenueData = analytics?.tierStats
    ? Object.entries(analytics.tierStats).map(([, val]: [string, any]) => ({
        nodeName: val.name,
        revenue: val.revenue || 0,
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {nodeSummary?.name || "Node Detail"}
        </h1>
        {nodeSummary && <NodeHealthBadge status={nodeSummary.status} />}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {analyticsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px]" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Connected Clients"
                  value={nodeSummary?.clientCount ?? 0}
                  icon={Users}
                />
                <StatCard
                  title="Total Revenue"
                  value={`$${(analytics?.totalRevenue ?? 0).toFixed(2)}`}
                  icon={DollarSign}
                />
                <StatCard
                  title="Active Sessions"
                  value={analytics?.activeSessions ?? 0}
                  icon={Activity}
                />
                <StatCard
                  title="Total Sessions"
                  value={analytics?.totalSessions ?? 0}
                  icon={Activity}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RevenueChart data={revenueData} title="Revenue by Tier" />
                <TierBreakdownChart data={tierBreakdown} />
              </div>

              {/* Payment methods */}
              {analytics?.paymentMethods && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(analytics.paymentMethods).map(
                    ([method, count]) => (
                      <div
                        key={method}
                        className="border rounded-lg p-4 text-center"
                      >
                        <p className="text-2xl font-bold">{count as number}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {method}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Clients tab */}
        <TabsContent value="clients" className="mt-4">
          <ClientsTable
            clients={clientsData?.clients || []}
            isLoading={clientsLoading}
            onDisconnect={handleDisconnect}
            disconnecting={disconnectMutation.isPending}
          />
        </TabsContent>

        {/* Sessions tab */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setSessionOffset(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SessionsTable
            sessions={sessionsData?.sessions || []}
            isLoading={sessionsLoading}
            onRevoke={handleRevoke}
            revoking={revokeMutation.isPending}
          />

          {/* Pagination */}
          {sessionsData && sessionsData.total > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {sessionOffset + 1}–
                {Math.min(sessionOffset + PAGE_SIZE, sessionsData.total)} of{" "}
                {sessionsData.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sessionOffset === 0}
                  onClick={() =>
                    setSessionOffset(Math.max(0, sessionOffset - PAGE_SIZE))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sessionOffset + PAGE_SIZE >= sessionsData.total}
                  onClick={() => setSessionOffset(sessionOffset + PAGE_SIZE)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
