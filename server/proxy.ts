import type { NodeConfig, NodeSummary, BrokerHealth, Analytics } from "@shared/types";
import { updateNodeToken } from "./nodes";
import { log } from "./vite";

const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function authenticate(node: NodeConfig): Promise<string> {
  const res = await fetchWithTimeout(`${node.url}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: node.adminPassword }),
  });

  if (!res.ok) {
    throw new Error(`Auth failed for ${node.name}: ${res.status}`);
  }

  const data = await res.json();
  const token = data.token as string;
  updateNodeToken(node.id, token);
  node.adminToken = token;
  return token;
}

export async function proxyGet(
  node: NodeConfig,
  path: string,
  requireAuth = false,
): Promise<any> {
  const headers: Record<string, string> = {};

  if (requireAuth) {
    if (!node.adminToken) {
      await authenticate(node);
    }
    headers["Authorization"] = `Bearer ${node.adminToken}`;
  }

  let res = await fetchWithTimeout(`${node.url}${path}`, { headers });

  // Re-authenticate on 401
  if (res.status === 401 && requireAuth) {
    await authenticate(node);
    headers["Authorization"] = `Bearer ${node.adminToken}`;
    res = await fetchWithTimeout(`${node.url}${path}`, { headers });
  }

  if (!res.ok) {
    throw new Error(`Proxy GET ${path} on ${node.name}: ${res.status}`);
  }

  return res.json();
}

export async function proxyDelete(
  node: NodeConfig,
  path: string,
  requireAuth = false,
): Promise<any> {
  const headers: Record<string, string> = {};

  if (requireAuth) {
    if (!node.adminToken) {
      await authenticate(node);
    }
    headers["Authorization"] = `Bearer ${node.adminToken}`;
  }

  let res = await fetchWithTimeout(`${node.url}${path}`, {
    method: "DELETE",
    headers,
  });

  if (res.status === 401 && requireAuth) {
    await authenticate(node);
    headers["Authorization"] = `Bearer ${node.adminToken}`;
    res = await fetchWithTimeout(`${node.url}${path}`, {
      method: "DELETE",
      headers,
    });
  }

  if (!res.ok) {
    throw new Error(`Proxy DELETE ${path} on ${node.name}: ${res.status}`);
  }

  return res.json();
}

export async function testConnection(url: string, password: string): Promise<{ success: boolean; message: string; health?: BrokerHealth }> {
  try {
    // Test health endpoint
    const healthRes = await fetchWithTimeout(`${url}/api/health`);
    if (!healthRes.ok) {
      return { success: false, message: `Health check failed: ${healthRes.status}` };
    }
    const health = await healthRes.json();

    // Test auth
    const authRes = await fetchWithTimeout(`${url}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!authRes.ok) {
      return { success: false, message: "Authentication failed - check admin password" };
    }

    return { success: true, message: "Connection successful", health };
  } catch (err: any) {
    const msg = err.name === "AbortError" ? "Connection timed out" : err.message;
    return { success: false, message: msg };
  }
}

export async function fetchNodeSummary(node: NodeConfig): Promise<NodeSummary> {
  try {
    const [health, clientsData, analytics] = await Promise.allSettled([
      proxyGet(node, "/api/health"),
      proxyGet(node, "/api/network/clients"),
      proxyGet(node, "/api/admin/analytics", true),
    ]);

    const healthData = health.status === "fulfilled" ? health.value : undefined;
    const clients = clientsData.status === "fulfilled" ? clientsData.value : { totalClients: 0 };
    const analyticsData: Partial<Analytics> = analytics.status === "fulfilled" ? analytics.value : {};

    const tierStats = (analyticsData as any)?.tierStats || {};
    const revenueByTier: Record<string, number> = {};
    const sessionsByTier: Record<string, number> = {};
    for (const [key, val] of Object.entries(tierStats)) {
      const t = val as any;
      revenueByTier[t.name || key] = t.revenue || 0;
      sessionsByTier[t.name || key] = t.count || 0;
    }

    return {
      id: node.id,
      name: node.name,
      url: node.url,
      status: healthData ? "online" : "unreachable",
      health: healthData,
      clientCount: clients.totalClients || 0,
      activeSessionCount: (analyticsData as any)?.activeSessions || 0,
      totalRevenue: (analyticsData as any)?.totalRevenue || 0,
      revenueByTier,
      sessionsByTier,
    };
  } catch (err: any) {
    log(`Node ${node.name} unreachable: ${err.message}`);
    return {
      id: node.id,
      name: node.name,
      url: node.url,
      status: "unreachable",
      clientCount: 0,
      activeSessionCount: 0,
      totalRevenue: 0,
      revenueByTier: {},
      sessionsByTier: {},
      error: err.message,
    };
  }
}

export async function fetchAllNodes(nodes: NodeConfig[]): Promise<NodeSummary[]> {
  const results = await Promise.allSettled(nodes.map(fetchNodeSummary));
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          id: nodes[i].id,
          name: nodes[i].name,
          url: nodes[i].url,
          status: "unreachable" as const,
          clientCount: 0,
          activeSessionCount: 0,
          totalRevenue: 0,
          revenueByTier: {},
          sessionsByTier: {},
          error: r.reason?.message || "Unknown error",
        },
  );
}
