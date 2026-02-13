import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";

interface Session {
  id?: number;
  sessionGuid: string;
  tierName: string;
  paymentMethod: string;
  status: string;
  dataUsedMB: number;
  dataLimitMB?: number;
  createdAt: string;
  expiryDate?: string;
  clientIp?: string;
}

interface SessionsTableProps {
  sessions: Session[];
  isLoading: boolean;
  onRevoke?: (sessionId: string) => void;
  revoking?: boolean;
}

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-600 hover:bg-green-600";
    case "expired":
      return "bg-yellow-600 hover:bg-yellow-600";
    case "revoked":
      return "bg-red-600 hover:bg-red-600";
    default:
      return "";
  }
}

export function SessionsTable({
  sessions,
  isLoading,
  onRevoke,
  revoking,
}: SessionsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No sessions found
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data Usage</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Expires</TableHead>
          {onRevoke && <TableHead className="w-[80px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => {
          const usagePercent =
            session.dataLimitMB && session.dataLimitMB > 0
              ? Math.min(
                  100,
                  (session.dataUsedMB / session.dataLimitMB) * 100,
                )
              : 0;

          return (
            <TableRow key={session.sessionGuid || session.id}>
              <TableCell className="font-mono text-xs">
                {(session.sessionGuid || "").slice(0, 12)}...
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{session.tierName}</Badge>
              </TableCell>
              <TableCell className="text-sm capitalize">
                {session.paymentMethod || "—"}
              </TableCell>
              <TableCell>
                <Badge className={statusColor(session.status)}>
                  {session.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={usagePercent} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {session.dataUsedMB.toFixed(1)}
                    {session.dataLimitMB
                      ? ` / ${session.dataLimitMB} MB`
                      : " MB"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(session.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {session.expiryDate
                  ? new Date(session.expiryDate).toLocaleString()
                  : "—"}
              </TableCell>
              {onRevoke && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revoking || session.status !== "active"}
                    onClick={() =>
                      onRevoke(String(session.id || session.sessionGuid))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
