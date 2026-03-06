import type { WorldFirstClient } from "../client.js";

export const fxTools = {
  get_fx_quote: {
    description:
      'Get a live foreign exchange rate quote for a currency pair. Returns a tradeable quote with price and expiry time. Use this to check rates before making cross-border payments. For example, to see how much CNY you\'ll need to pay a Chinese supplier in USD, set sell_currency="USD" and buy_currency="CNY". The quote is valid for a limited time (check quoteExpiryTime).',
    inputSchema: {
      type: "object" as const,
      properties: {
        sell_currency: {
          type: "string",
          description:
            'The currency you are selling / sending (ISO 4217). Example: "USD" if paying from your USD balance.',
        },
        buy_currency: {
          type: "string",
          description:
            'The currency you are buying / the supplier receives (ISO 4217). Example: "CNY" for Chinese supplier payments.',
        },
        sell_amount: {
          type: "string",
          description:
            'Amount to sell, as a string with 2 decimal places (e.g. "10000.00"). Provide either sell_amount or buy_amount, not both.',
        },
        buy_amount: {
          type: "string",
          description:
            'Amount to buy, as a string with 2 decimal places (e.g. "70000.00"). Provide either sell_amount or buy_amount, not both.',
        },
      },
      required: ["sell_currency", "buy_currency"],
    },
    handler: async (
      client: WorldFirstClient,
      args: {
        sell_currency: string;
        buy_currency: string;
        sell_amount?: string;
        buy_amount?: string;
      }
    ) => {
      const body: Record<string, unknown> = {
        sellCurrency: args.sell_currency.toUpperCase(),
        buyCurrency: args.buy_currency.toUpperCase(),
      };
      if (args.sell_amount) body.sellAmount = { value: args.sell_amount, currency: args.sell_currency.toUpperCase() };
      if (args.buy_amount) body.buyAmount = { value: args.buy_amount, currency: args.buy_currency.toUpperCase() };

      const response = await client.request(
        "/amsin/api/v1/business/fund/createQuote",
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

  get_fx_rate: {
    description:
      "Get a reference (indicative) FX rate for a currency pair. This is informational only — not a tradeable quote. Use get_fx_quote instead if you plan to execute a trade. Useful for comparing rates or displaying estimated costs to users.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sell_currency: {
          type: "string",
          description: 'Currency you are selling (ISO 4217). Example: "USD".',
        },
        buy_currency: {
          type: "string",
          description: 'Currency you are buying (ISO 4217). Example: "CNY".',
        },
      },
      required: ["sell_currency", "buy_currency"],
    },
    handler: async (
      client: WorldFirstClient,
      args: { sell_currency: string; buy_currency: string }
    ) => {
      const response = await client.request(
        "/amsin/api/v1/business/fund/inquiryRate",
        {
          sellCurrency: args.sell_currency.toUpperCase(),
          buyCurrency: args.buy_currency.toUpperCase(),
        }
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

  lock_fx_rate: {
    description:
      'Lock an FX rate by accepting a previously obtained quote. Use get_fx_quote first to get a quoteId, then pass it here to execute the trade at the quoted rate. This is how you lock in a rate for a supplier payment — especially useful when CNY/USD is volatile. IMPORTANT: Only call this when you are ready to commit to the trade. The quote must not be expired (check quoteExpiryTime from get_fx_quote).',
    inputSchema: {
      type: "object" as const,
      properties: {
        quote_id: {
          type: "string",
          description:
            "The quoteId returned from a previous get_fx_quote call. Must be used before the quote expires.",
        },
      },
      required: ["quote_id"],
    },
    handler: async (client: WorldFirstClient, args: { quote_id: string }) => {
      const response = await client.request(
        "/amsin/api/v1/business/fund/applyQuote",
        { quoteId: args.quote_id }
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
