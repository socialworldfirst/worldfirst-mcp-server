import type { WorldFirstClient } from "../client.js";

export const balanceTools = {
  check_balance: {
    description:
      "Check the available balance of your WorldFirst World Account across all currencies, or for a specific currency. Use this before making payments to confirm sufficient funds. Returns total balance, available balance (what you can spend), and frozen/held amounts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        currency: {
          type: "string",
          description:
            'ISO 4217 currency code to check balance for (e.g. "USD", "CNY", "EUR", "GBP"). Omit to get balances for all currencies.',
        },
      },
    },
    handler: async (client: WorldFirstClient, args: { currency?: string }) => {
      const body: Record<string, unknown> = {};
      if (args.currency) {
        body.currency = args.currency.toUpperCase();
      }

      const response = await client.request(
        "/amsin/api/v1/business/account/inquiryBalance",
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
