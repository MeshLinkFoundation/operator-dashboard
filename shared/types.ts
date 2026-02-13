// Node configuration stored in nodes.json
export interface NodeConfig {
  id: string;
  name: string;
  url: string;
  adminPassword: string;
  adminToken?: string;
}

// Node config returned to the client (no passwords)
export interface NodeInfo {
  id: string;
  name: string;
  url: string;
}

// Health response from broker /api/health
export interface BrokerHealth {
  status: string;
  uptime: number;
  timestamp: string;
}

// Connected client from broker /api/network/clients
export interface ConnectedClient {
  ip: string;
  mac: string;
  tier: string;
  connectedAt: string;
  expiresAt: string;
  bytesUsed?: number;
  dataLimitMB?: number;
}

// Session from broker /api/admin/sessions
export interface Session {
  id: string;
  guid: string;
  tier: string;
  tierName?: string;
  paymentMethod: string;
  paymentReference?: string;
  status: string;
  dataUsedMB: number;
  dataLimitMB: number;
  createdAt: string;
  expiresAt: string;
  clientIp: string;
  deviceFingerprint?: string;
}

// Analytics from broker /api/admin/analytics
export interface Analytics {
  totalSessions: number;
  activeSessions: number;
  totalRevenue: number;
  revenueByTier: Record<string, number>;
  sessionsByTier: Record<string, number>;
  sessionsByPaymentMethod: Record<string, number>;
  recentSessions: Session[];
}

// Broker config from /api/config
export interface BrokerConfig {
  nodeInfo: {
    name: string;
    location: string;
    operator: string;
  };
  pricing: {
    tiers: Array<{
      id: string;
      name: string;
      price: number;
      fiatPrice: number;
      isFree: boolean;
    }>;
  };
}

// Per-node summary for the overview
export interface NodeSummary {
  id: string;
  name: string;
  url: string;
  status: "online" | "unreachable";
  health?: BrokerHealth;
  clientCount: number;
  activeSessionCount: number;
  totalRevenue: number;
  revenueByTier: Record<string, number>;
  sessionsByTier: Record<string, number>;
  error?: string;
}

// Aggregated overview response
export interface OverviewData {
  totalClients: number;
  totalRevenue: number;
  activeSessions: number;
  nodesOnline: number;
  nodesTotal: number;
  nodes: NodeSummary[];
  revenueByNode: Array<{ nodeId: string; nodeName: string; revenue: number }>;
  tierBreakdown: Array<{ tier: string; count: number }>;
}

// Request body for adding/updating a node
export interface NodeInput {
  name: string;
  url: string;
  adminPassword: string;
}

// Test connection result
export interface TestResult {
  success: boolean;
  message: string;
  health?: BrokerHealth;
}
