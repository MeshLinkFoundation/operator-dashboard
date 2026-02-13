import type { Express } from "express";
import type { NodeInput, OverviewData } from "@shared/types";
import { loadNodes, addNode, updateNode, removeNode, getNode } from "./nodes";
import { fetchAllNodes, proxyGet, proxyDelete, testConnection } from "./proxy";

export function registerRoutes(app: Express): void {
  // --- Node config CRUD ---

  app.get("/api/dashboard/nodes", (_req, res) => {
    const nodes = loadNodes().map(({ adminPassword, adminToken, ...rest }) => rest);
    res.json(nodes);
  });

  app.post("/api/dashboard/nodes", async (req, res) => {
    try {
      const input = req.body as NodeInput;
      if (!input.name || !input.url || !input.adminPassword) {
        return res.status(400).json({ error: "name, url, and adminPassword are required" });
      }

      // Test connection first
      const test = await testConnection(input.url.replace(/\/+$/, ""), input.adminPassword);
      if (!test.success) {
        return res.status(400).json({ error: `Connection test failed: ${test.message}` });
      }

      const node = addNode(input);
      const { adminPassword, adminToken, ...safe } = node;
      res.status(201).json(safe);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/dashboard/nodes/:id", (req, res) => {
    const updated = updateNode(req.params.id, req.body as Partial<NodeInput>);
    if (!updated) return res.status(404).json({ error: "Node not found" });
    const { adminPassword, adminToken, ...safe } = updated;
    res.json(safe);
  });

  app.delete("/api/dashboard/nodes/:id", (req, res) => {
    const ok = removeNode(req.params.id);
    if (!ok) return res.status(404).json({ error: "Node not found" });
    res.json({ success: true });
  });

  app.post("/api/dashboard/nodes/:id/test", async (req, res) => {
    const node = getNode(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });

    const result = await testConnection(node.url, node.adminPassword);
    res.json(result);
  });

  // --- Aggregated overview ---

  app.get("/api/dashboard/overview", async (_req, res) => {
    try {
      const nodes = loadNodes();
      const summaries = await fetchAllNodes(nodes);

      const totalClients = summaries.reduce((s, n) => s + n.clientCount, 0);
      const totalRevenue = summaries.reduce((s, n) => s + n.totalRevenue, 0);
      const activeSessions = summaries.reduce((s, n) => s + n.activeSessionCount, 0);
      const nodesOnline = summaries.filter((n) => n.status === "online").length;

      // Aggregate tier breakdown across all nodes
      const tierMap = new Map<string, number>();
      for (const node of summaries) {
        for (const [tier, count] of Object.entries(node.sessionsByTier)) {
          tierMap.set(tier, (tierMap.get(tier) || 0) + count);
        }
      }

      const overview: OverviewData = {
        totalClients,
        totalRevenue,
        activeSessions,
        nodesOnline,
        nodesTotal: nodes.length,
        nodes: summaries,
        revenueByNode: summaries.map((n) => ({
          nodeId: n.id,
          nodeName: n.name,
          revenue: n.totalRevenue,
        })),
        tierBreakdown: Array.from(tierMap.entries()).map(([tier, count]) => ({
          tier,
          count,
        })),
      };

      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Per-node proxy routes ---

  app.get("/api/dashboard/nodes/:id/clients", async (req, res) => {
    try {
      const node = getNode(req.params.id);
      if (!node) return res.status(404).json({ error: "Node not found" });
      const data = await proxyGet(node, "/api/network/clients");
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: err.message });
    }
  });

  app.get("/api/dashboard/nodes/:id/analytics", async (req, res) => {
    try {
      const node = getNode(req.params.id);
      if (!node) return res.status(404).json({ error: "Node not found" });
      const data = await proxyGet(node, "/api/admin/analytics", true);
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: err.message });
    }
  });

  app.get("/api/dashboard/nodes/:id/sessions", async (req, res) => {
    try {
      const node = getNode(req.params.id);
      if (!node) return res.status(404).json({ error: "Node not found" });
      const query = new URLSearchParams(req.query as Record<string, string>).toString();
      const path = `/api/admin/sessions${query ? `?${query}` : ""}`;
      const data = await proxyGet(node, path, true);
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: err.message });
    }
  });

  app.delete("/api/dashboard/nodes/:id/clients/:ip", async (req, res) => {
    try {
      const node = getNode(req.params.id);
      if (!node) return res.status(404).json({ error: "Node not found" });
      const data = await proxyDelete(node, `/api/network/clients/${req.params.ip}`);
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: err.message });
    }
  });

  app.delete("/api/dashboard/nodes/:id/sessions/:sessionId", async (req, res) => {
    try {
      const node = getNode(req.params.id);
      if (!node) return res.status(404).json({ error: "Node not found" });
      const data = await proxyDelete(node, `/api/admin/sessions/${req.params.sessionId}`, true);
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: err.message });
    }
  });
}
