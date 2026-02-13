import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { NodeConfig, NodeInput } from "@shared/types";

const NODES_FILE = path.resolve(import.meta.dirname, "..", "nodes.json");

export function loadNodes(): NodeConfig[] {
  try {
    const raw = fs.readFileSync(NODES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveNodes(nodes: NodeConfig[]): void {
  fs.writeFileSync(NODES_FILE, JSON.stringify(nodes, null, 2), "utf-8");
}

export function addNode(input: NodeInput): NodeConfig {
  const nodes = loadNodes();
  const node: NodeConfig = {
    id: randomUUID(),
    name: input.name,
    url: input.url.replace(/\/+$/, ""),
    adminPassword: input.adminPassword,
  };
  nodes.push(node);
  saveNodes(nodes);
  return node;
}

export function updateNode(id: string, input: Partial<NodeInput>): NodeConfig | null {
  const nodes = loadNodes();
  const idx = nodes.findIndex((n) => n.id === id);
  if (idx === -1) return null;

  if (input.name !== undefined) nodes[idx].name = input.name;
  if (input.url !== undefined) nodes[idx].url = input.url.replace(/\/+$/, "");
  if (input.adminPassword !== undefined) {
    nodes[idx].adminPassword = input.adminPassword;
    nodes[idx].adminToken = undefined; // clear cached token
  }

  saveNodes(nodes);
  return nodes[idx];
}

export function removeNode(id: string): boolean {
  const nodes = loadNodes();
  const filtered = nodes.filter((n) => n.id !== id);
  if (filtered.length === nodes.length) return false;
  saveNodes(filtered);
  return true;
}

export function getNode(id: string): NodeConfig | undefined {
  return loadNodes().find((n) => n.id === id);
}

export function updateNodeToken(id: string, token: string): void {
  const nodes = loadNodes();
  const node = nodes.find((n) => n.id === id);
  if (node) {
    node.adminToken = token;
    saveNodes(nodes);
  }
}
