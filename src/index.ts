#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WorldFirstClient } from "./client.js";
import { balanceTools } from "./tools/balance.js";
import { fxTools } from "./tools/fx.js";
import { paymentTools } from "./tools/payment.js";
import { beneficiaryTools } from "./tools/beneficiary.js";
import { statementTools } from "./tools/statement.js";
import type { WorldFirstConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Config from environment
// ---------------------------------------------------------------------------
function loadConfig(): WorldFirstConfig {
  const clientId = process.env.WORLDFIRST_CLIENT_ID;
  const privateKey = process.env.WORLDFIRST_PRIVATE_KEY;
  const environment = (process.env.WORLDFIRST_ENVIRONMENT ?? "sandbox") as
    | "sandbox"
    | "production";
  const region = (process.env.WORLDFIRST_REGION ?? "sg") as
    | "sg"
    | "eu"
    | "us";

  if (!clientId || !privateKey) {
    console.error(
      "Missing required environment variables: WORLDFIRST_CLIENT_ID and WORLDFIRST_PRIVATE_KEY.\n" +
        "Set these before starting the MCP server.\n\n" +
        "  WORLDFIRST_CLIENT_ID=your_client_id \\\n" +
        '  WORLDFIRST_PRIVATE_KEY="$(cat private_key.pem)" \\\n' +
        "  worldfirst-mcp-server\n"
    );
    process.exit(1);
  }

  // Support both inline key and file-path-style newlines
  const formattedKey = privateKey.includes("\\n")
    ? privateKey.replace(/\\n/g, "\n")
    : privateKey;

  return { clientId, privateKey: formattedKey, environment, region };
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------
const config = loadConfig();
const client = new WorldFirstClient(config);

const server = new McpServer({
  name: "worldfirst",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// Register tools
// ---------------------------------------------------------------------------

// --- Balance ---
server.tool(
  "check_balance",
  balanceTools.check_balance.description,
  { currency: z.string().optional().describe("ISO 4217 currency code (e.g. USD, CNY). Omit for all.") },
  async (args) => {
    const result = await balanceTools.check_balance.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// --- FX ---
server.tool(
  "get_fx_rate",
  fxTools.get_fx_rate.description,
  {
    sell_currency: z.string().describe("Currency you are selling (ISO 4217). e.g. USD"),
    buy_currency: z.string().describe("Currency you are buying (ISO 4217). e.g. CNY"),
  },
  async (args) => {
    const result = await fxTools.get_fx_rate.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_fx_quote",
  fxTools.get_fx_quote.description,
  {
    sell_currency: z.string().describe("Currency you are selling (ISO 4217). e.g. USD"),
    buy_currency: z.string().describe("Currency you are buying (ISO 4217). e.g. CNY"),
    sell_amount: z.string().optional().describe('Amount to sell, e.g. "10000.00". Provide sell_amount or buy_amount, not both.'),
    buy_amount: z.string().optional().describe('Amount to buy, e.g. "70000.00". Provide sell_amount or buy_amount, not both.'),
  },
  async (args) => {
    const result = await fxTools.get_fx_quote.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "lock_fx_rate",
  fxTools.lock_fx_rate.description,
  {
    quote_id: z.string().describe("The quoteId from a previous get_fx_quote call."),
  },
  async (args) => {
    const result = await fxTools.lock_fx_rate.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// --- Beneficiary / Supplier ---
server.tool(
  "list_beneficiaries",
  beneficiaryTools.list_beneficiaries.description,
  {
    page_index: z.number().optional().describe("Page number (starts at 1). Default: 1."),
    page_size: z.number().optional().describe("Results per page (max 50). Default: 20."),
  },
  async (args) => {
    const result = await beneficiaryTools.list_beneficiaries.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "add_beneficiary",
  beneficiaryTools.add_beneficiary.description,
  {
    beneficiary_name: z.string().describe("Legal name of the beneficiary as registered with their bank."),
    bank_account_no: z.string().describe("Bank account number."),
    currency: z.string().describe('Currency of the account (ISO 4217). e.g. "CNY".'),
    country: z.string().describe('ISO 3166-1 alpha-2 country code. e.g. "CN".'),
    bank_name: z.string().optional().describe("Name of the beneficiary's bank."),
    bank_code: z.string().optional().describe("SWIFT/BIC or local bank code."),
  },
  async (args) => {
    const result = await beneficiaryTools.add_beneficiary.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "verify_supplier",
  beneficiaryTools.verify_supplier.description,
  {
    beneficiary_id: z.string().describe("The beneficiary ID to verify."),
  },
  async (args) => {
    const result = await beneficiaryTools.verify_supplier.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// --- Payment ---
server.tool(
  "create_payment",
  paymentTools.create_payment.description,
  {
    payment_request_id: z.string().describe("Unique ID for idempotency. Use a UUID."),
    beneficiary_id: z.string().describe("Beneficiary ID to pay."),
    amount: z.string().describe('Payment amount, e.g. "5000.00".'),
    currency: z.string().describe('Payment currency (ISO 4217). e.g. "CNY".'),
    purpose: z.string().optional().describe('Payment purpose/description for compliance.'),
    quote_id: z.string().optional().describe("Quote ID from lock_fx_rate for cross-currency payments."),
  },
  async (args) => {
    const result = await paymentTools.create_payment.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "check_payment_status",
  paymentTools.check_payment_status.description,
  {
    payment_id: z.string().optional().describe("Payment ID from create_payment."),
    payment_request_id: z.string().optional().describe("Your unique payment_request_id."),
  },
  async (args) => {
    const result = await paymentTools.check_payment_status.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// --- Statement ---
server.tool(
  "get_statement",
  statementTools.get_statement.description,
  {
    currency: z.string().optional().describe('Filter by currency (ISO 4217). e.g. "CNY".'),
    start_date: z.string().optional().describe("Start date (ISO 8601)."),
    end_date: z.string().optional().describe("End date (ISO 8601)."),
    page_index: z.number().optional().describe("Page number (starts at 1). Default: 1."),
    page_size: z.number().optional().describe("Results per page (max 50). Default: 20."),
  },
  async (args) => {
    const result = await statementTools.get_statement.handler(client, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
