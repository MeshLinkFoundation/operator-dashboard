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
import { Skeleton } from "@/components/ui/skeleton";
import { Unplug } from "lucide-react";

interface Client {
  ip: string;
  mac: string;
  tier: string;
  expiryDate?: string;
  downloadLimit?: string;
  uploadLimit?: string;
}

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onDisconnect?: (ip: string) => void;
  disconnecting?: boolean;
}

export function ClientsTable({
  clients,
  isLoading,
  onDisconnect,
  disconnecting,
}: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!clients.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No connected clients
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>IP Address</TableHead>
          <TableHead>MAC</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Bandwidth</TableHead>
          <TableHead>Expires</TableHead>
          {onDisconnect && <TableHead className="w-[80px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.ip}>
            <TableCell className="font-mono text-sm">{client.ip}</TableCell>
            <TableCell className="font-mono text-sm">
              {client.mac || "—"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{client.tier}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {client.downloadLimit || "—"} / {client.uploadLimit || "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {client.expiryDate
                ? new Date(client.expiryDate).toLocaleString()
                : "—"}
            </TableCell>
            {onDisconnect && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disconnecting}
                  onClick={() => onDisconnect(client.ip)}
                >
                  <Unplug className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
