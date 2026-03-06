import type { WorldFirstClient } from "../client.js";

export const paymentTools = {
  create_payment: {
    description:
      'Create a payment (transfer/payout) to a registered beneficiary. This initiates a real money transfer from your WorldFirst World Account to the supplier\'s bank account. For CNY payments to Chinese suppliers, WorldFirst settles 80% same-day and 90% next-day via MYbank routing. IMPORTANT: The beneficiary must already be registered via add_beneficiary. Use check_balance first to confirm sufficient funds. Use get_fx_quote + lock_fx_rate first if paying in a different currency than your balance. Provide a unique payment_request_id for idempotency — retrying with the same ID will not create duplicate payments.',
    inputSchema: {
      type: "object" as const,
      properties: {
        payment_request_id: {
          type: "string",
          description:
            "A unique identifier you generate for this payment request. Used for idempotency — if you retry with the same ID, only one payment is created. Use a UUID or similar unique string.",
        },
        beneficiary_id: {
          type: "string",
          description:
            "The beneficiary ID to pay. Get this from list_beneficiaries or add_beneficiary.",
        },
        amount: {
          type: "string",
          description:
            'Payment amount as a string with 2 decimal places. Example: "5000.00".',
        },
        currency: {
          type: "string",
          description:
            'Currency of the payment (ISO 4217). Example: "CNY" for Chinese supplier payments, "USD" for US dollar payments.',
        },
        purpose: {
          type: "string",
          description:
            'Payment purpose/description. Example: "Invoice #1234 — bulk electronics order". Helps with compliance and reconciliation.',
        },
        quote_id: {
          type: "string",
          description:
            "Optional. If you locked an FX rate via lock_fx_rate, pass the quote_id here to use that rate. Omit for same-currency payments.",
        },
      },
      required: [
        "payment_request_id",
        "beneficiary_id",
        "amount",
        "currency",
      ],
    },
    handler: async (
      client: WorldFirstClient,
      args: {
        payment_request_id: string;
        beneficiary_id: string;
        amount: string;
        currency: string;
        purpose?: string;
        quote_id?: string;
      }
    ) => {
      const body: Record<string, unknown> = {
        paymentRequestId: args.payment_request_id,
        beneficiaryId: args.beneficiary_id,
        paymentAmount: {
          value: args.amount,
          currency: args.currency.toUpperCase(),
        },
      };
      if (args.purpose) body.paymentPurpose = args.purpose;
      if (args.quote_id) body.quoteId = args.quote_id;

      const response = await client.request(
        "/amsin/api/v1/business/fund/createPayout",
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

  check_payment_status: {
    description:
      'Check the status of a payment/transfer. Returns current settlement status, timestamps, and any error details. Payments to Chinese suppliers via WorldFirst typically settle same-day (80%) or next-day (90%). Use this to track whether a payment has been completed, is still processing, or has failed. If status is "U" (unknown), wait and retry — the payment may still be processing.',
    inputSchema: {
      type: "object" as const,
      properties: {
        payment_id: {
          type: "string",
          description:
            "The payment ID returned from create_payment. Alternatively, use payment_request_id.",
        },
        payment_request_id: {
          type: "string",
          description:
            "The unique payment_request_id you provided when creating the payment. Use this if you don't have the payment_id.",
        },
      },
    },
    handler: async (
      client: WorldFirstClient,
      args: { payment_id?: string; payment_request_id?: string }
    ) => {
      const body: Record<string, unknown> = {};
      if (args.payment_id) body.paymentId = args.payment_id;
      if (args.payment_request_id) body.paymentRequestId = args.payment_request_id;

      if (!args.payment_id && !args.payment_request_id) {
        return {
          error: true,
          code: "MISSING_PARAM",
          message: "Provide either payment_id or payment_request_id.",
        };
      }

      const response = await client.request(
        "/amsin/api/v1/business/fund/inquiryPayout",
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
