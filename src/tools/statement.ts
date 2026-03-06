import type { WorldFirstClient } from "../client.js";

export const statementTools = {
  get_statement: {
    description:
      "Retrieve transaction history (statement) for your WorldFirst World Account. Returns a list of transactions with amounts, currencies, timestamps, and descriptions. Use this for reconciliation, auditing agent payment activity, or checking recent transactions. Filter by currency and/or date range. Results are paginated.",
    inputSchema: {
      type: "object" as const,
      properties: {
        currency: {
          type: "string",
          description:
            'Filter by currency (ISO 4217). Example: "CNY" to see only CNY transactions. Omit to see all currencies.',
        },
        start_date: {
          type: "string",
          description:
            'Start date for the statement period (ISO 8601). Example: "2026-01-01T00:00:00+00:00". Omit for all-time.',
        },
        end_date: {
          type: "string",
          description:
            'End date for the statement period (ISO 8601). Example: "2026-03-06T23:59:59+00:00". Omit for up to now.',
        },
        page_index: {
          type: "number",
          description: "Page number for pagination (starts at 1). Default: 1.",
        },
        page_size: {
          type: "number",
          description:
            "Number of results per page (max 50). Default: 20.",
        },
      },
    },
    handler: async (
      client: WorldFirstClient,
      args: {
        currency?: string;
        start_date?: string;
        end_date?: string;
        page_index?: number;
        page_size?: number;
      }
    ) => {
      const body: Record<string, unknown> = {
        pageIndex: args.page_index ?? 1,
        pageSize: args.page_size ?? 20,
      };
      if (args.currency) body.currency = args.currency.toUpperCase();
      if (args.start_date) body.startTime = args.start_date;
      if (args.end_date) body.endTime = args.end_date;

      const response = await client.request(
        "/amsin/api/v1/business/account/inquiryStatementList",
        body
      );

      if (response.result.resultStatus !== "S") {
        return {
          error: true,
          code: response.result.resultCode,
          message: response.result.resultMessage,
        };
      }

      return response;
    },
  },
};
