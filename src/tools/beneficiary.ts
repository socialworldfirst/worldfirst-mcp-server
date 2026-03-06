import type { WorldFirstClient } from "../client.js";

export const beneficiaryTools = {
  list_beneficiaries: {
    description:
      "List all saved beneficiaries (suppliers/payees) on your WorldFirst account. Returns beneficiary IDs, names, bank details, and verification status. Use this to find a supplier's beneficiary ID before making a payment with create_payment.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page_index: {
          type: "number",
          description: "Page number for pagination (starts at 1). Default: 1.",
        },
        page_size: {
          type: "number",
          description: "Number of results per page (max 50). Default: 20.",
        },
      },
    },
    handler: async (
      client: WorldFirstClient,
      args: { page_index?: number; page_size?: number }
    ) => {
      const response = await client.request(
        "/amsin/api/v1/business/fund/queryBeneficiary",
        {
          pageIndex: args.page_index ?? 1,
          pageSize: args.page_size ?? 20,
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

  add_beneficiary: {
    description:
      'Register a new beneficiary (supplier/payee) for future payments. You must add a beneficiary before you can pay them. For Chinese suppliers, use currency "CNY" and provide their Chinese bank account details. WorldFirst will verify the beneficiary account against business registration records. After adding, use the returned beneficiary_id with create_payment.',
    inputSchema: {
      type: "object" as const,
      properties: {
        beneficiary_name: {
          type: "string",
          description:
            "Legal name of the beneficiary as registered with their bank. For Chinese companies, use the full registered Chinese company name.",
        },
        bank_account_no: {
          type: "string",
          description: "Bank account number of the beneficiary.",
        },
        bank_name: {
          type: "string",
          description: "Name of the beneficiary's bank.",
        },
        currency: {
          type: "string",
          description:
            'Currency of the beneficiary account (ISO 4217). Example: "CNY" for Chinese bank accounts.',
        },
        country: {
          type: "string",
          description:
            'ISO 3166-1 alpha-2 country code of the beneficiary. Example: "CN" for China.',
        },
        bank_code: {
          type: "string",
          description:
            "SWIFT/BIC code or local bank code. Required for some corridors.",
        },
      },
      required: ["beneficiary_name", "bank_account_no", "currency", "country"],
    },
    handler: async (
      client: WorldFirstClient,
      args: {
        beneficiary_name: string;
        bank_account_no: string;
        bank_name?: string;
        currency: string;
        country: string;
        bank_code?: string;
      }
    ) => {
      const body: Record<string, unknown> = {
        beneficiaryName: args.beneficiary_name,
        bankAccountNo: args.bank_account_no,
        currency: args.currency.toUpperCase(),
        country: args.country.toUpperCase(),
      };
      if (args.bank_name) body.bankName = args.bank_name;
      if (args.bank_code) body.bankCode = args.bank_code;

      const response = await client.request(
        "/amsin/api/v1/business/fund/addBeneficiary",
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

  verify_supplier: {
    description:
      "Verify a supplier/beneficiary's bank account against their business registration records. WorldFirst checks that the account holder matches the registered business entity. Use this BEFORE making a first payment to a new supplier to reduce fraud risk. Returns verification status and any discrepancies found. This is one of WorldFirst's unique capabilities — critical for safe China sourcing.",
    inputSchema: {
      type: "object" as const,
      properties: {
        beneficiary_id: {
          type: "string",
          description:
            "The beneficiary ID from list_beneficiaries or add_beneficiary. The beneficiary must already be registered.",
        },
      },
      required: ["beneficiary_id"],
    },
    handler: async (
      client: WorldFirstClient,
      args: { beneficiary_id: string }
    ) => {
      const response = await client.request(
        "/amsin/api/v1/business/fund/verifyBeneficiary",
        { beneficiaryId: args.beneficiary_id }
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
