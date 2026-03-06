/** WorldFirst API configuration */
export interface WorldFirstConfig {
  /** Client ID issued by WorldFirst */
  clientId: string;
  /** RSA private key (PEM format) for request signing */
  privateKey: string;
  /** Environment: sandbox or production */
  environment: "sandbox" | "production";
  /** Regional endpoint: sg (Singapore), eu (Europe), us (United States) */
  region: "sg" | "eu" | "us";
}

/** Standard WorldFirst API response envelope */
export interface ApiResponse<T = Record<string, unknown>> {
  result: {
    resultStatus: "S" | "F" | "U";
    resultCode: string;
    resultMessage: string;
  };
  [key: string]: unknown;
}

/** Balance inquiry response */
export interface BalanceInfo {
  currency: string;
  totalAmount: string;
  availableAmount: string;
  frozenAmount: string;
}

/** FX rate quote */
export interface FxQuote {
  quoteId: string;
  quoteCurrencyPair: string;
  quotePrice: string;
  quoteStartTime: string;
  quoteExpiryTime: string;
  tradingType: string;
}

/** Beneficiary (supplier) record */
export interface Beneficiary {
  beneficiaryId: string;
  beneficiaryName: string;
  bankAccountNo: string;
  bankName: string;
  currency: string;
  status: string;
}

/** Payment/transfer record */
export interface PaymentOrder {
  paymentId: string;
  paymentRequestId: string;
  status: string;
  amount: string;
  currency: string;
  beneficiaryId: string;
  createTime: string;
}

/** Statement/transaction entry */
export interface StatementEntry {
  transactionId: string;
  transactionType: string;
  amount: string;
  currency: string;
  balance: string;
  transactionTime: string;
  remark: string;
}
