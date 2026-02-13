import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  fetchNodes,
  fetchOverview,
  fetchNodeClients,
  fetchNodeAnalytics,
  fetchNodeSessions,
  addNode,
  updateNodeApi,
  deleteNode,
  testNode,
  disconnectClient,
  revokeSession,
} from "@/lib/api";
import type { NodeInput } from "@shared/types";

export function useNodes() {
  return useQuery({
    queryKey: ["/api/dashboard/nodes"],
    queryFn: fetchNodes,
  });
}

export function useOverview() {
  return useQuery({
    queryKey: ["/api/dashboard/overview"],
    queryFn: fetchOverview,
    refetchInterval: 10_000,
  });
}

export function useNodeClients(nodeId: string) {
  return useQuery({
    queryKey: [`/api/dashboard/nodes/${nodeId}/clients`],
    queryFn: () => fetchNodeClients(nodeId),
    refetchInterval: 5_000,
    enabled: !!nodeId,
  });
}

export function useNodeAnalytics(nodeId: string) {
  return useQuery({
    queryKey: [`/api/dashboard/nodes/${nodeId}/analytics`],
    queryFn: () => fetchNodeAnalytics(nodeId),
    refetchInterval: 10_000,
    enabled: !!nodeId,
  });
}

export function useNodeSessions(
  nodeId: string,
  params?: { status?: string; limit?: number; offset?: number },
) {
  return useQuery({
    queryKey: [`/api/dashboard/nodes/${nodeId}/sessions`, params],
    queryFn: () => fetchNodeSessions(nodeId, params),
    refetchInterval: 10_000,
    enabled: !!nodeId,
  });
}

export function useAddNode() {
  return useMutation({
    mutationFn: (input: NodeInput) => addNode(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
    },
  });
}

export function useUpdateNode() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<NodeInput> }) =>
      updateNodeApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/nodes"] });
    },
  });
}

export function useDeleteNode() {
  return useMutation({
    mutationFn: (id: string) => deleteNode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
    },
  });
}

export function useTestNode() {
  return useMutation({
    mutationFn: (id: string) => testNode(id),
  });
}

export function useDisconnectClient(nodeId: string) {
  return useMutation({
    mutationFn: (ip: string) => disconnectClient(nodeId, ip),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/dashboard/nodes/${nodeId}/clients`],
      });
    },
  });
}

export function useRevokeSession(nodeId: string) {
  return useMutation({
    mutationFn: (sessionId: string) => revokeSession(nodeId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/dashboard/nodes/${nodeId}/sessions`],
      });
    },
  });
}
