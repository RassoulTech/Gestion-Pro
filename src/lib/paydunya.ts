import crypto from "node:crypto";
import { env } from "@/env.mjs";

export interface PayDunyaInitiateParams {
  transactionId: string;
  amount: number;
  description: string;
  storeName?: string;
  cancelUrl: string;
  returnUrl: string;
  callbackUrl: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customData?: Record<string, string | number | undefined>;
}

export interface PayDunyaInitiateResponse {
  response_code: string;
  /** PayDunya returns the invoice URL here when response_code is "00". */
  response_text: string;
  description?: string;
  token?: string;
  /** Not always returned — extract the URL from `response_text` instead. */
  invoice_url?: string;
}

/**
 * Returns the checkout URL from a PayDunya initiate response.
 * PayDunya returns the URL in `response_text` when the invoice is created;
 * `invoice_url` is sometimes absent. Returns null when the response is not a
 * valid creation.
 */
export function extractPayDunyaCheckoutUrl(
  res: PayDunyaInitiateResponse
): string | null {
  if (res.response_code !== "00" || !res.token) return null;
  const candidate = res.invoice_url || res.response_text || "";
  return candidate.startsWith("http") ? candidate : null;
}

export type PayDunyaInvoiceStatus = "completed" | "pending" | "failed" | "cancelled";

export interface PayDunyaConfirmResponse {
  response_code: string;
  response_text: string;
  hash?: string;
  invoice?: {
    token?: string;
    total_amount?: number;
    description?: string;
    items?: Record<string, unknown>;
  };
  custom_data?: Record<string, string>;
  status?: PayDunyaInvoiceStatus;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  receipt_url?: string;
  mode?: "test" | "live";
}

export class PayDunyaClient {
  private static mode: "test" | "live" =
    (env.PAYDUNYA_MODE as "test" | "live" | undefined) === "live" ? "live" : "test";

  private static get baseUrl(): string {
    return this.mode === "live"
      ? "https://app.paydunya.com/api/v1"
      : "https://app.paydunya.com/sandbox-api/v1";
  }

  private static get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": env.PAYDUNYA_MASTER_KEY || "",
      "PAYDUNYA-PRIVATE-KEY": env.PAYDUNYA_PRIVATE_KEY || "",
      "PAYDUNYA-PUBLIC-KEY": env.PAYDUNYA_PUBLIC_KEY || "",
      "PAYDUNYA-TOKEN": env.PAYDUNYA_TOKEN || "",
      "PAYDUNYA-MODE": this.mode,
    };
  }

  static async initiateInvoice(
    params: PayDunyaInitiateParams
  ): Promise<PayDunyaInitiateResponse> {
    try {
      const customData: Record<string, string> = {
        transactionId: params.transactionId,
      };
      if (params.customData) {
        for (const [k, v] of Object.entries(params.customData)) {
          if (v !== undefined) customData[k] = String(v);
        }
      }

      const body = {
        invoice: {
          total_amount: params.amount,
          description: params.description,
        },
        store: {
          name: params.storeName || "GestionPro",
        },
        custom_data: customData,
        actions: {
          cancel_url: params.cancelUrl,
          return_url: params.returnUrl,
          callback_url: params.callbackUrl,
        },
        ...(params.customerName || params.customerEmail || params.customerPhone
          ? {
              customer: {
                name: params.customerName,
                email: params.customerEmail,
                phone: params.customerPhone,
              },
            }
          : {}),
      };

      const response = await fetch(`${this.baseUrl}/checkout-invoice/create`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      });

      return (await response.json()) as PayDunyaInitiateResponse;
    } catch (error) {
      console.error("PayDunya initiation error:", error);
      return {
        response_code: "-1",
        response_text:
          error instanceof Error ? error.message : "Failed to contact PayDunya API",
      };
    }
  }

  /**
   * Verify the IPN hash sent by PayDunya in callback payloads.
   * PayDunya signs the callback with `SHA-512(MASTER_KEY)`.
   * Returns `true` when the keys are not configured (dev/mock mode) so the
   * webhook still works in sandbox without leaking real keys.
   */
  static verifyIpnHash(receivedHash: string | undefined | null): boolean {
    const masterKey = env.PAYDUNYA_MASTER_KEY || "";
    if (!masterKey || masterKey.includes("mock")) return true;
    if (!receivedHash) return false;

    const expected = crypto.createHash("sha512").update(masterKey).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(receivedHash, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  static async confirmInvoice(token: string): Promise<PayDunyaConfirmResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/checkout-invoice/confirm/${encodeURIComponent(token)}`,
        {
          method: "GET",
          headers: this.headers,
        }
      );

      return (await response.json()) as PayDunyaConfirmResponse;
    } catch (error) {
      console.error("PayDunya confirmation error:", error);
      return {
        response_code: "-1",
        response_text:
          error instanceof Error ? error.message : "Failed to contact PayDunya API",
      };
    }
  }
}
