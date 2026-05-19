import { env } from "@/env.mjs";

export interface CinetPayInitiateParams {
  transactionId: string;
  amount: number;
  currency?: string;
  description: string;
  notifyUrl: string;
  returnUrl: string;
  channels?: string; // ALL, MOBILE_MONEY, CREDIT_CARD, etc.
}

export interface CinetPayInitiateResponse {
  code: string;
  message: string;
  description?: string;
  data?: {
    payment_url: string;
    payment_token: string;
  };
}

export interface CinetPayVerifyResponse {
  code: string;
  message: string;
  data?: {
    amount?: number;
    currency?: string;
    status?: string;
    payment_method?: string;
    description?: string;
    operator_id?: string;
    payment_date?: string;
    [key: string]: unknown;
  };
}

export class CinetPayClient {
  private static apiKey = env.CINETPAY_API_KEY || "";
  private static siteId = env.CINETPAY_SITE_ID || "";
  private static baseUrl = "https://api-checkout.cinetpay.com/v2";

  static async initiatePayment(params: CinetPayInitiateParams): Promise<CinetPayInitiateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: params.transactionId,
          amount: params.amount,
          currency: params.currency || "XOF",
          description: params.description,
          notify_url: params.notifyUrl,
          return_url: params.returnUrl,
          channels: params.channels || "ALL",
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("CinetPay initiation error:", error);
      return {
        code: "-1",
        message: error instanceof Error ? error.message : "Failed to contact CinetPay API",
      };
    }
  }

  static async verifyPayment(transactionId: string): Promise<CinetPayVerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: transactionId,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("CinetPay verification error:", error);
      return {
        code: "-1",
        message: error instanceof Error ? error.message : "Failed to contact CinetPay API",
      };
    }
  }
}
