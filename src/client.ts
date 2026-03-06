import crypto from "node:crypto";
import type { WorldFirstConfig, ApiResponse } from "./types.js";

/** Domain mapping per environment and region */
const DOMAINS: Record<string, Record<string, string>> = {
  sandbox: {
    sg: "https://open-sea-global.alipayplus.com",
    eu: "https://open-eu-global.alipayplus.com",
    us: "https://open-na-global.alipayplus.com",
  },
  production: {
    sg: "https://open-sea-global.alipay.com",
    eu: "https://open-eu-global.alipay.com",
    us: "https://open-na-global.alipay.com",
  },
};

/**
 * WorldFirst API client.
 * Handles RSA2-SHA256 request signing and HTTP communication
 * with the WorldFirst/Alipay+ gateway.
 */
export class WorldFirstClient {
  private config: WorldFirstConfig;
  private baseUrl: string;

  constructor(config: WorldFirstConfig) {
    this.config = config;
    this.baseUrl =
      DOMAINS[config.environment]?.[config.region] ??
      DOMAINS.sandbox.sg;
  }

  /**
   * Generate RSA2-SHA256 signature for a request.
   *
   * Signing content format:
   *   "<HTTP_METHOD> <path>\n<clientId>.<requestTime>.<body>"
   */
  private sign(method: string, path: string, requestTime: string, body: string): string {
    const content = `${method} ${path}\n${this.config.clientId}.${requestTime}.${body}`;
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(content);
    signer.end();
    return signer.sign(this.config.privateKey, "base64");
  }

  /**
   * Make a signed POST request to the WorldFirst API.
   */
  async request<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const requestTime = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
    const bodyStr = JSON.stringify(body);
    const signature = this.sign("POST", path, requestTime, bodyStr);

    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": this.config.clientId,
        "Request-Time": requestTime,
        Signature: `algorithm=RSA256,keyVersion=0,signature=${signature}`,
      },
      body: bodyStr,
    });

    if (!response.ok) {
      throw new Error(
        `WorldFirst API error: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as ApiResponse<T>;
  }
}
