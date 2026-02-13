import { Badge } from "@/components/ui/badge";

interface NodeHealthBadgeProps {
  status: "online" | "unreachable";
}

export function NodeHealthBadge({ status }: NodeHealthBadgeProps) {
  if (status === "online") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-600">
        Online
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      Unreachable
    </Badge>
  );
}
