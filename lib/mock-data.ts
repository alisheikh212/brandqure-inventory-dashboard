// ============================================================
// BrandQure Inventory Command Center — Mock Data
// Phase 2: Expanded schema with per-client data, new inventory
// fields, users, and marketplace breakdown.
// ============================================================

// ============================================================
// Types
// ============================================================

export type StockStatus = "Optimal" | "Good" | "Review" | "Critical";
export type Tier = "Enterprise" | "Pro" | "Basic";
export type Marketplace = "Amazon USA" | "Amazon Canada" | "Shopify" | "Walmart";
export type MarketplaceFilter = "All" | Marketplace;
export type InventoryStatus =
  | "Healthy"
  | "Low Stock"
  | "Critical Low"
  | "Out of Stock"
  | "Overstock";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client";
  /** Only set for client-role users */
  clientSlug?: string;
  avatarInitial: string;
}

export interface Client {
  id: string;
  slug: string;
  name: string;
  tier: Tier;
  logoInitial: string;
  activeSKUs: number;
  stockHealth: number;
  stockStatus: StockStatus;
  /** Default lead time in days applied to all SKUs unless overridden */
  defaultLeadTimeDays: number;
  lastUpdated: string;
}

export interface InventoryRow {
  id: string;
  clientSlug: string;
  productName: string;
  asin: string;
  sku: string;
  marketplace: Marketplace;
  /** Units currently available in FBA and ready to sell */
  fbaAvailable: number;
  /** Units inbound / en-route to FBA */
  inboundUnits: number;
  /** Units reserved by pending orders */
  reservedUnits: number;
  /** 30-day average daily sales velocity */
  avgDailySales: number;
  /** SKU-level lead time in days (may differ from client default) */
  leadTimeDays: number;
  status: InventoryStatus;
  threePlInventory: number;
  threePlLocation: string;
  lastUpdated: string;
}

export interface PurchaseOrder {
  id: string;
  clientSlug: string;
  poNumber: string;
  /** SKU code this order is replenishing */
  sku: string;
  /** Human-readable product name for display */
  productName: string;
  marketplace: Marketplace;
  units: number;
  /** ISO date string — when the order was placed ("YYYY-MM-DD") */
  orderCreatedDate: string;
  /** Lead time in days for this order — used to compute expected arrival */
  leadTimeDays: number;
}

export interface SummaryStats {
  totalActiveSKUs: number;
  outOfStock: number;
  overstockItems: number;
  inTransit: number;
  reorderNow: number;
  /** SKUs in "Reorder Soon" zone — lead time + 14-day safety window */
  reorderSoon: number;
  /** 0–100 — percentage of SKUs not needing attention */
  healthScore: number;
  capitalTiedUp: string;
  skuTrend: string;
}

// ============================================================
// Users
// ============================================================

export const ADMIN_USER: User = {
  id: "u-admin-001",
  name: "Alex Johnson",
  email: "alex@brandqure.com",
  role: "admin",
  avatarInitial: "AJ",
};

export const CLIENT_USERS: User[] = [
  {
    id: "u-client-001",
    name: "Sarah Chen",
    email: "sarah@acmecorp.com",
    role: "client",
    clientSlug: "acme-corp",
    avatarInitial: "SC",
  },
  {
    id: "u-client-002",
    name: "Marcus Wright",
    email: "marcus@techlogix.com",
    role: "client",
    clientSlug: "techlogix",
    avatarInitial: "MW",
  },
  {
    id: "u-client-003",
    name: "Priya Patel",
    email: "priya@globalretailers.com",
    role: "client",
    clientSlug: "global-retailers",
    avatarInitial: "PP",
  },
  {
    id: "u-client-004",
    name: "Jordan Kim",
    email: "jordan@democlient.com",
    role: "client",
    clientSlug: "demo-client",
    avatarInitial: "JK",
  },
];

export const ALL_USERS: User[] = [ADMIN_USER, ...CLIENT_USERS];

// ============================================================
// Clients
// ============================================================

export const CLIENTS: Client[] = [
  {
    id: "c-001",
    slug: "acme-corp",
    name: "Acme Corp",
    tier: "Enterprise",
    logoInitial: "A",
    activeSKUs: 1240,
    stockHealth: 83,
    stockStatus: "Good",
    defaultLeadTimeDays: 21,
    lastUpdated: "2026-05-14",
  },
  {
    id: "c-002",
    slug: "techlogix",
    name: "TechLogix",
    tier: "Pro",
    logoInitial: "T",
    activeSKUs: 850,
    stockHealth: 67,
    stockStatus: "Review",
    defaultLeadTimeDays: 28,
    lastUpdated: "2026-05-13",
  },
  {
    id: "c-003",
    slug: "global-retailers",
    name: "Global Retailers",
    tier: "Basic",
    logoInitial: "G",
    activeSKUs: 320,
    stockHealth: 72,
    stockStatus: "Review",
    defaultLeadTimeDays: 35,
    lastUpdated: "2026-05-12",
  },
  {
    id: "c-004",
    slug: "demo-client",
    name: "Demo Client",
    tier: "Enterprise",
    logoInitial: "D",
    activeSKUs: 1248,
    stockHealth: 71,
    stockStatus: "Review",
    defaultLeadTimeDays: 21,
    lastUpdated: "2026-05-14",
  },
];

// ============================================================
// Marketplaces
// ============================================================

export const MARKETPLACES: MarketplaceFilter[] = [
  "All",
  "Amazon USA",
  "Amazon Canada",
  "Shopify",
  "Walmart",
];

// ============================================================
// Inventory — Acme Corp
// Lead time default: 21 days | Products: consumer electronics
// ============================================================

const ACME_INVENTORY: InventoryRow[] = [
  {
    id: "acme-1",
    clientSlug: "acme-corp",
    productName: "Wireless Earbuds Pro X",
    asin: "B0BWEP1001",
    sku: "ACM-PRO-X-US",
    marketplace: "Amazon USA",
    fbaAvailable: 42,
    inboundUnits: 0,
    reservedUnits: 8,
    avgDailySales: 32,
    leadTimeDays: 21,
    status: "Critical Low",
    threePlInventory: 0,
    threePlLocation: "Apex Logistics — Dallas Hub",
    lastUpdated: "2026-05-14",
  },
  {
    id: "acme-2",
    clientSlug: "acme-corp",
    productName: "Charging Station 4-in-1",
    asin: "B0BCHG1002",
    sku: "ACM-CHG-4N1-US",
    marketplace: "Amazon USA",
    fbaAvailable: 890,
    inboundUnits: 400,
    reservedUnits: 120,
    avgDailySales: 45,
    leadTimeDays: 21,
    status: "Healthy",
    threePlInventory: 200,
    threePlLocation: "FedEx Fulfillment — Chicago",
    lastUpdated: "2026-05-14",
  },
  {
    id: "acme-3",
    clientSlug: "acme-corp",
    productName: "Smart LED Strip 5m",
    asin: "B0BLED1003",
    sku: "ACM-LED-5M-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 156,
    inboundUnits: 0,
    reservedUnits: 22,
    avgDailySales: 18,
    leadTimeDays: 21,
    status: "Low Stock",
    threePlInventory: 50,
    threePlLocation: "UPS Supply Chain — Mississauga",
    lastUpdated: "2026-05-13",
  },
  {
    id: "acme-4",
    clientSlug: "acme-corp",
    productName: "Laptop Stand Adjustable",
    asin: "B0BLPT1004",
    sku: "ACM-LPT-STD-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 780,
    inboundUnits: 0,
    reservedUnits: 45,
    avgDailySales: 14,
    leadTimeDays: 21,
    status: "Healthy",
    threePlInventory: 120,
    threePlLocation: "Ryder Supply Chain — Toronto",
    lastUpdated: "2026-05-12",
  },
  {
    id: "acme-5",
    clientSlug: "acme-corp",
    productName: "Phone Case Bundle (3-pack)",
    asin: "B0BPHC1005",
    sku: "ACM-PHN-CB-SP",
    marketplace: "Shopify",
    fbaAvailable: 480,
    inboundUnits: 0,
    reservedUnits: 30,
    avgDailySales: 15,
    leadTimeDays: 14,
    status: "Healthy",
    threePlInventory: 80,
    threePlLocation: "Apex Logistics — LA Hub",
    lastUpdated: "2026-05-13",
  },
  {
    id: "acme-6",
    clientSlug: "acme-corp",
    productName: "Portable Battery Pack 26800mAh",
    asin: "B0BBAT1006",
    sku: "ACM-BAT-26K-US",
    marketplace: "Amazon USA",
    fbaAvailable: 3400,
    inboundUnits: 600,
    reservedUnits: 200,
    avgDailySales: 38,
    leadTimeDays: 21,
    status: "Overstock",
    threePlInventory: 500,
    threePlLocation: "XPO Logistics — Memphis",
    lastUpdated: "2026-05-11",
  },
];

// ============================================================
// Inventory — TechLogix
// Lead time default: 28 days | Products: B2B tech accessories
// ============================================================

const TECHLOGIX_INVENTORY: InventoryRow[] = [
  {
    id: "tlx-1",
    clientSlug: "techlogix",
    productName: "USB-C Docking Station 12-in-1",
    asin: "B0CTLG2201",
    sku: "TLX-DOCK-12-US",
    marketplace: "Amazon USA",
    fbaAvailable: 88,
    inboundUnits: 60,
    reservedUnits: 15,
    avgDailySales: 22,
    leadTimeDays: 28,
    status: "Critical Low",
    threePlInventory: 0,
    threePlLocation: "DHL Fulfillment — Atlanta",
    lastUpdated: "2026-05-14",
  },
  {
    id: "tlx-2",
    clientSlug: "techlogix",
    productName: "Mechanical Keyboard TKL Wireless",
    asin: "B0CTLG2202",
    sku: "TLX-KBD-TKL-US",
    marketplace: "Amazon USA",
    fbaAvailable: 1250,
    inboundUnits: 0,
    reservedUnits: 85,
    avgDailySales: 42,
    leadTimeDays: 28,
    status: "Healthy",
    threePlInventory: 350,
    threePlLocation: "Geodis — Nashville",
    lastUpdated: "2026-05-14",
  },
  {
    id: "tlx-3",
    clientSlug: "techlogix",
    productName: "Webcam 4K Pro Auto-Focus",
    asin: "B0CTLG2203",
    sku: "TLX-CAM-4K-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 0,
    inboundUnits: 200,
    reservedUnits: 0,
    avgDailySales: 12,
    leadTimeDays: 28,
    status: "Out of Stock",
    threePlInventory: 40,
    threePlLocation: "XPO Logistics — Brampton",
    lastUpdated: "2026-05-12",
  },
  {
    id: "tlx-4",
    clientSlug: "techlogix",
    productName: "Ergonomic Desk Mat XL",
    asin: "B0CTLG2204",
    sku: "TLX-MAT-XL-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 580,
    inboundUnits: 150,
    reservedUnits: 40,
    avgDailySales: 20,
    leadTimeDays: 28,
    status: "Healthy",
    threePlInventory: 120,
    threePlLocation: "UPS Supply Chain — Vancouver",
    lastUpdated: "2026-05-13",
  },
  {
    id: "tlx-5",
    clientSlug: "techlogix",
    productName: "HDMI 2.1 Cable 3m 8K",
    asin: "B0CTLG2205",
    sku: "TLX-HDMI-3M-US",
    marketplace: "Amazon USA",
    fbaAvailable: 2800,
    inboundUnits: 200,
    reservedUnits: 120,
    avgDailySales: 55,
    leadTimeDays: 21,
    status: "Healthy",
    threePlInventory: 600,
    threePlLocation: "FedEx Fulfillment — Dallas",
    lastUpdated: "2026-05-13",
  },
  {
    id: "tlx-6",
    clientSlug: "techlogix",
    productName: "KVM Switch 4-Port HDMI",
    asin: "B0CTLG2206",
    sku: "TLX-KVM-4P-WM",
    marketplace: "Walmart",
    fbaAvailable: 2100,
    inboundUnits: 800,
    reservedUnits: 90,
    avgDailySales: 18,
    leadTimeDays: 35,
    status: "Overstock",
    threePlInventory: 300,
    threePlLocation: "Apex Logistics — Phoenix",
    lastUpdated: "2026-05-11",
  },
];

// ============================================================
// Inventory — Global Retailers
// Lead time default: 35 days | Products: home goods
// ============================================================

const GLOBAL_RETAILERS_INVENTORY: InventoryRow[] = [
  {
    id: "glr-1",
    clientSlug: "global-retailers",
    productName: "Bamboo Cutting Board Set (3pc)",
    asin: "B0CGLR3301",
    sku: "GLR-BCB-3PC-US",
    marketplace: "Amazon USA",
    fbaAvailable: 180,
    inboundUnits: 0,
    reservedUnits: 25,
    avgDailySales: 28,
    leadTimeDays: 35,
    status: "Low Stock",
    threePlInventory: 0,
    threePlLocation: "Geodis — Houston",
    lastUpdated: "2026-05-14",
  },
  {
    id: "glr-2",
    clientSlug: "global-retailers",
    productName: "Air Purifier HEPA H13",
    asin: "B0CGLR3302",
    sku: "GLR-APF-H13-US",
    marketplace: "Amazon USA",
    fbaAvailable: 920,
    inboundUnits: 0,
    reservedUnits: 80,
    avgDailySales: 22,
    leadTimeDays: 35,
    status: "Healthy",
    threePlInventory: 150,
    threePlLocation: "Ryder Supply Chain — Dallas",
    lastUpdated: "2026-05-13",
  },
  {
    id: "glr-3",
    clientSlug: "global-retailers",
    productName: "Weighted Blanket 15lb Queen",
    asin: "B0CGLR3303",
    sku: "GLR-WBL-15Q-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 15,
    inboundUnits: 200,
    reservedUnits: 5,
    avgDailySales: 15,
    leadTimeDays: 35,
    status: "Critical Low",
    threePlInventory: 0,
    threePlLocation: "DHL Fulfillment — Calgary",
    lastUpdated: "2026-05-14",
  },
  {
    id: "glr-4",
    clientSlug: "global-retailers",
    productName: "Ceramic Cookware Set 10pc",
    asin: "B0CGLR3304",
    sku: "GLR-CWR-10PC-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 780,
    inboundUnits: 300,
    reservedUnits: 60,
    avgDailySales: 24,
    leadTimeDays: 35,
    status: "Healthy",
    threePlInventory: 200,
    threePlLocation: "UPS Supply Chain — Montreal",
    lastUpdated: "2026-05-12",
  },
  {
    id: "glr-5",
    clientSlug: "global-retailers",
    productName: "Memory Foam Pillow Set (2pk)",
    asin: "B0CGLR3305",
    sku: "GLR-MFP-2PK-WM",
    marketplace: "Walmart",
    fbaAvailable: 1200,
    inboundUnits: 400,
    reservedUnits: 110,
    avgDailySales: 32,
    leadTimeDays: 35,
    status: "Healthy",
    threePlInventory: 280,
    threePlLocation: "XPO Logistics — Columbus",
    lastUpdated: "2026-05-13",
  },
  {
    id: "glr-6",
    clientSlug: "global-retailers",
    productName: "Smart Diffuser RGB Ultrasonic",
    asin: "B0CGLR3306",
    sku: "GLR-DIF-RGB-US",
    marketplace: "Amazon USA",
    fbaAvailable: 3800,
    inboundUnits: 0,
    reservedUnits: 180,
    avgDailySales: 25,
    leadTimeDays: 35,
    status: "Overstock",
    threePlInventory: 600,
    threePlLocation: "Apex Logistics — Chicago",
    lastUpdated: "2026-05-10",
  },
];

// ============================================================
// Inventory — Demo Client
// Lead time default: 21 days | Products: mixed tech/lifestyle
// ============================================================

const DEMO_CLIENT_INVENTORY: InventoryRow[] = [
  {
    id: "demo-1",
    clientSlug: "demo-client",
    productName: "Noise Cancelling Headphones Pro",
    asin: "B0DEMO4401",
    sku: "DMO-NCH-PRO-US",
    marketplace: "Amazon USA",
    fbaAvailable: 12,
    inboundUnits: 0,
    reservedUnits: 3,
    avgDailySales: 45,
    leadTimeDays: 21,
    status: "Critical Low",
    threePlInventory: 0,
    threePlLocation: "Apex Logistics — Dallas Hub",
    lastUpdated: "2026-05-14",
  },
  {
    id: "demo-2",
    clientSlug: "demo-client",
    productName: "Mesh WiFi Router 3-pack AX6000",
    asin: "B0DEMO4402",
    sku: "DMO-WFI-AX6-US",
    marketplace: "Amazon USA",
    fbaAvailable: 680,
    inboundUnits: 500,
    reservedUnits: 95,
    avgDailySales: 52,
    leadTimeDays: 21,
    status: "Healthy",
    threePlInventory: 200,
    threePlLocation: "FedEx Fulfillment — Memphis",
    lastUpdated: "2026-05-14",
  },
  {
    id: "demo-3",
    clientSlug: "demo-client",
    productName: "Standing Desk Frame Electric",
    asin: "B0DEMO4403",
    sku: "DMO-DSK-ELT-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 94,
    inboundUnits: 250,
    reservedUnits: 18,
    avgDailySales: 18,
    leadTimeDays: 21,
    status: "Low Stock",
    threePlInventory: 30,
    threePlLocation: "Ryder Supply Chain — Markham",
    lastUpdated: "2026-05-13",
  },
  {
    id: "demo-4",
    clientSlug: "demo-client",
    productName: "Gaming Chair Pro Lumbar",
    asin: "B0DEMO4404",
    sku: "DMO-CHR-PRO-CA",
    marketplace: "Amazon Canada",
    fbaAvailable: 450,
    inboundUnits: 200,
    reservedUnits: 42,
    avgDailySales: 22,
    leadTimeDays: 21,
    status: "Healthy",
    threePlInventory: 80,
    threePlLocation: "Geodis — Toronto",
    lastUpdated: "2026-05-12",
  },
  {
    id: "demo-5",
    clientSlug: "demo-client",
    productName: "Ring Light 18-inch Bi-Color",
    asin: "B0DEMO4405",
    sku: "DMO-RLT-18-SP",
    marketplace: "Shopify",
    fbaAvailable: 560,
    inboundUnits: 0,
    reservedUnits: 55,
    avgDailySales: 14,
    leadTimeDays: 21,
    status: "Healthy",
    threePlInventory: 110,
    threePlLocation: "UPS Supply Chain — LA",
    lastUpdated: "2026-05-13",
  },
  {
    id: "demo-6",
    clientSlug: "demo-client",
    productName: "Smart Watch Series 5 GPS",
    asin: "B0DEMO4406",
    sku: "DMO-SWT-S5-US",
    marketplace: "Amazon USA",
    fbaAvailable: 1200,
    inboundUnits: 400,
    reservedUnits: 130,
    avgDailySales: 35,
    leadTimeDays: 21,
    status: "Healthy",
    threePlInventory: 250,
    threePlLocation: "XPO Logistics — Phoenix",
    lastUpdated: "2026-05-12",
  },
  {
    id: "demo-7",
    clientSlug: "demo-client",
    productName: "Projector Mini 4K Portable",
    asin: "B0DEMO4407",
    sku: "DMO-PRJ-4K-US",
    marketplace: "Amazon USA",
    fbaAvailable: 3200,
    inboundUnits: 800,
    reservedUnits: 210,
    avgDailySales: 28,
    leadTimeDays: 21,
    status: "Overstock",
    threePlInventory: 400,
    threePlLocation: "DHL Fulfillment — Chicago",
    lastUpdated: "2026-05-11",
  },
];

// ============================================================
// Purchase Orders — per client
// ============================================================

// All dates are "YYYY-MM-DD". Expected arrival = orderCreatedDate + leadTimeDays.
// Reference date for this mock dataset: 2026-05-14.

const ACME_POS: PurchaseOrder[] = [
  {
    id: "po-acme-1",
    clientSlug: "acme-corp",
    poNumber: "PO-ACM-8829",
    sku: "ACM-PRO-X-US",
    productName: "Wireless Earbuds Pro X",
    marketplace: "Amazon USA",
    units: 500,
    orderCreatedDate: "2026-04-14",
    leadTimeDays: 21,
    // expected: 2026-05-05 → 9 days overdue at reference date
  },
  {
    id: "po-acme-2",
    clientSlug: "acme-corp",
    poNumber: "PO-ACM-8830",
    sku: "ACM-LED-5M-CA",
    productName: "Smart LED Strip 5m",
    marketplace: "Amazon Canada",
    units: 400,
    orderCreatedDate: "2026-04-29",
    leadTimeDays: 21,
    // expected: 2026-05-20 → 6 days remaining
  },
  {
    id: "po-acme-3",
    clientSlug: "acme-corp",
    poNumber: "PO-ACM-8831",
    sku: "ACM-CHG-4N1-US",
    productName: "Charging Station 4-in-1",
    marketplace: "Amazon USA",
    units: 800,
    orderCreatedDate: "2026-05-03",
    leadTimeDays: 21,
    // expected: 2026-05-24 → 10 days remaining
  },
];

const TECHLOGIX_POS: PurchaseOrder[] = [
  {
    id: "po-tlx-1",
    clientSlug: "techlogix",
    poNumber: "PO-TLX-4410",
    sku: "TLX-DOCK-12-US",
    productName: "USB-C Docking Station 12-in-1",
    marketplace: "Amazon USA",
    units: 260,
    orderCreatedDate: "2026-04-21",
    leadTimeDays: 28,
    // expected: 2026-05-19 → 5 days remaining
  },
  {
    id: "po-tlx-2",
    clientSlug: "techlogix",
    poNumber: "PO-TLX-4411",
    sku: "TLX-CAM-4K-CA",
    productName: "Webcam 4K Pro Auto-Focus",
    marketplace: "Amazon Canada",
    units: 400,
    orderCreatedDate: "2026-04-23",
    leadTimeDays: 28,
    // expected: 2026-05-21 → 7 days remaining
  },
  {
    id: "po-tlx-3",
    clientSlug: "techlogix",
    poNumber: "PO-TLX-4412",
    sku: "TLX-KBD-TKL-US",
    productName: "Mechanical Keyboard TKL Wireless",
    marketplace: "Amazon USA",
    units: 600,
    orderCreatedDate: "2026-05-02",
    leadTimeDays: 28,
    // expected: 2026-05-30 → 16 days remaining
  },
];

const GLOBAL_RETAILERS_POS: PurchaseOrder[] = [
  {
    id: "po-glr-1",
    clientSlug: "global-retailers",
    poNumber: "PO-GLR-2201",
    sku: "GLR-BCB-3PC-US",
    productName: "Bamboo Cutting Board Set (3pc)",
    marketplace: "Amazon USA",
    units: 200,
    orderCreatedDate: "2026-04-20",
    leadTimeDays: 35,
    // expected: 2026-05-25 → 11 days remaining
  },
  {
    id: "po-glr-2",
    clientSlug: "global-retailers",
    poNumber: "PO-GLR-2202",
    sku: "GLR-WBL-15Q-CA",
    productName: "Weighted Blanket 15lb Queen",
    marketplace: "Amazon Canada",
    units: 350,
    orderCreatedDate: "2026-05-01",
    leadTimeDays: 35,
    // expected: 2026-06-05 → 22 days remaining
  },
];

const DEMO_CLIENT_POS: PurchaseOrder[] = [
  {
    id: "po-demo-1",
    clientSlug: "demo-client",
    poNumber: "PO-DMO-9901",
    sku: "DMO-NCH-PRO-US",
    productName: "Noise Cancelling Headphones Pro",
    marketplace: "Amazon USA",
    units: 450,
    orderCreatedDate: "2026-04-14",
    leadTimeDays: 21,
    // expected: 2026-05-05 → 9 days overdue at reference date
  },
  {
    id: "po-demo-2",
    clientSlug: "demo-client",
    poNumber: "PO-DMO-9902",
    sku: "DMO-DSK-ELT-CA",
    productName: "Standing Desk Frame Electric",
    marketplace: "Amazon Canada",
    units: 400,
    orderCreatedDate: "2026-04-30",
    leadTimeDays: 21,
    // expected: 2026-05-21 → 7 days remaining
  },
  {
    id: "po-demo-3",
    clientSlug: "demo-client",
    poNumber: "PO-DMO-9903",
    sku: "DMO-WFI-AX6-US",
    productName: "Mesh WiFi Router 3-pack AX6000",
    marketplace: "Amazon USA",
    units: 800,
    orderCreatedDate: "2026-05-04",
    leadTimeDays: 21,
    // expected: 2026-05-25 → 11 days remaining
  },
];

// ============================================================
// Lookup maps
// ============================================================

const INVENTORY_BY_CLIENT: Record<string, InventoryRow[]> = {
  "acme-corp": ACME_INVENTORY,
  "techlogix": TECHLOGIX_INVENTORY,
  "global-retailers": GLOBAL_RETAILERS_INVENTORY,
  "demo-client": DEMO_CLIENT_INVENTORY,
};

const PURCHASE_ORDERS_BY_CLIENT: Record<string, PurchaseOrder[]> = {
  "acme-corp": ACME_POS,
  "techlogix": TECHLOGIX_POS,
  "global-retailers": GLOBAL_RETAILERS_POS,
  "demo-client": DEMO_CLIENT_POS,
};

// ============================================================
// Helpers
// ============================================================

export function getClientBySlug(slug: string): Client | undefined {
  return CLIENTS.find((c) => c.slug === slug);
}

export function getInventoryBySlug(slug: string): InventoryRow[] {
  return INVENTORY_BY_CLIENT[slug] ?? DEMO_CLIENT_INVENTORY;
}

export function getPurchaseOrdersBySlug(slug: string): PurchaseOrder[] {
  return PURCHASE_ORDERS_BY_CLIENT[slug] ?? DEMO_CLIENT_POS;
}

/** All clients' inventory combined — useful for admin-level views */
export function getAllInventory(): InventoryRow[] {
  return Object.values(INVENTORY_BY_CLIENT).flat();
}
