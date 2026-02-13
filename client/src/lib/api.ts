import type {
  NodeInfo,
  OverviewData,
  TestResult,
  NodeInput,
} from "@shared/types";
import { apiRequest } from "./queryClient";

// Node CRUD
export async function fetchNodes(): Promise<NodeInfo[]> {
  const res = await fetch("/api/dashboard/nodes");
  if (!res.ok) throw new Error("Failed to fetch nodes");
  return res.json();
}

export async function addNode(input: NodeInput): Promise<NodeInfo> {
  const res = await apiRequest("POST", "/api/dashboard/nodes", input);
  return res.json();
}

export async function updateNodeApi(
  id: string,
  input: Partial<NodeInput>,
): Promise<NodeInfo> {
  const res = await apiRequest("PUT", `/api/dashboard/nodes/${id}`, input);
  return res.json();
}

export async function deleteNode(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/dashboard/nodes/${id}`);
}

export async function testNode(id: string): Promise<TestResult> {
  const res = await apiRequest("POST", `/api/dashboard/nodes/${id}/test`);
  return res.json();
}

// Overview
export async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch("/api/dashboard/overview");
  if (!res.ok) throw new Error("Failed to fetch overview");
  return res.json();
}

// Per-node
export async function fetchNodeClients(id: string) {
  const res = await fetch(`/api/dashboard/nodes/${id}/clients`);
  if (!res.ok) throw new Error("Failed to fetch clients");
  return res.json();
}

export async function fetchNodeAnalytics(id: string) {
  const res = await fetch(`/api/dashboard/nodes/${id}/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function fetchNodeSessions(
  id: string,
  params?: { status?: string; limit?: number; offset?: number },
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  const res = await fetch(
    `/api/dashboard/nodes/${id}/sessions${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function disconnectClient(
  nodeId: string,
  ip: string,
): Promise<void> {
  await apiRequest("DELETE", `/api/dashboard/nodes/${nodeId}/clients/${ip}`);
}

export async function revokeSession(
  nodeId: string,
  sessionId: string,
): Promise<void> {
  await apiRequest(
    "DELETE",
    `/api/dashboard/nodes/${nodeId}/sessions/${sessionId}`,
  );
}
