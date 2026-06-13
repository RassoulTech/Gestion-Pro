// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    commandeClient: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/services/payment.service", () => ({
  PaymentService: {
    handlePaymentWebhook: vi.fn().mockResolvedValue({ success: true }),
  },
}));

import { POST } from "@/app/api/paytech/ipn/route";
import { prisma } from "@/lib/prisma";
import { PaymentService } from "@/server/services/payment.service";

const API_KEY = "test-api-key";
const API_SECRET = "test-api-secret";

const sha256 = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

function ipnRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/paytech/ipn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function signedBody(overrides: Record<string, unknown> = {}) {
  return {
    type_event: "sale_complete",
    ref_command: "CMD-123",
    api_key_sha256: sha256(API_KEY),
    api_secret_sha256: sha256(API_SECRET),
    payment_method: "Orange Money",
    token: "tok_abc",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PAYTECH_API_KEY = API_KEY;
  process.env.PAYTECH_API_SECRET = API_SECRET;
});

describe("POST /api/paytech/ipn — authentification", () => {
  it("rejette une signature invalide avec un 401 sans toucher à la base", async () => {
    const res = await POST(
      ipnRequest(signedBody({ api_key_sha256: sha256("forged-key") }))
    );

    expect(res.status).toBe(401);
    expect(prisma.commandeClient.updateMany).not.toHaveBeenCalled();
    expect(prisma.commandeClient.update).not.toHaveBeenCalled();
    expect(PaymentService.handlePaymentWebhook).not.toHaveBeenCalled();
  });

  it("rejette un secret invalide même si la clé API est correcte", async () => {
    const res = await POST(
      ipnRequest(signedBody({ api_secret_sha256: sha256("forged-secret") }))
    );

    expect(res.status).toBe(401);
    expect(prisma.commandeClient.updateMany).not.toHaveBeenCalled();
  });

  it("refuse de traiter quoi que ce soit si les clés PayTech ne sont pas configurées", async () => {
    delete process.env.PAYTECH_API_KEY;
    delete process.env.PAYTECH_API_SECRET;

    // Sans le garde-fou, sha256("") des deux côtés validerait cette requête.
    const res = await POST(
      ipnRequest(
        signedBody({
          api_key_sha256: sha256(""),
          api_secret_sha256: sha256(""),
        })
      )
    );

    expect(res.status).toBe(503);
    expect(prisma.commandeClient.updateMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/paytech/ipn — commandes marketplace", () => {
  it("confirme toutes les commandes listées dans custom_field", async () => {
    const res = await POST(
      ipnRequest(
        signedBody({
          custom_field: JSON.stringify({
            kind: "marketplace_order",
            commandeIds: "cmd-1,cmd-2",
          }),
        })
      )
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(prisma.commandeClient.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["cmd-1", "cmd-2"] } },
      data: {
        statutPaiement: "CONFIRME",
        // Payé ≠ livré : le paiement valide la commande, il ne la livre pas.
        etat: "VALIDEE",
        modePaiement: "Orange Money",
        paymentToken: "tok_abc",
      },
    });
  });

  it("retombe sur la recherche par code commande quand custom_field est absent", async () => {
    vi.mocked(prisma.commandeClient.findFirst).mockResolvedValueOnce({
      id: "order-77",
    } as never);

    const res = await POST(ipnRequest(signedBody({ ref_command: "CMD-777" })));

    expect(res.status).toBe(200);
    expect(prisma.commandeClient.findFirst).toHaveBeenCalledWith({
      where: { code: "CMD-777" },
    });
    expect(prisma.commandeClient.update).toHaveBeenCalledWith({
      where: { id: "order-77" },
      data: expect.objectContaining({ statutPaiement: "CONFIRME" }),
    });
  });

  it("répond 200 sans écrire si aucune commande ne correspond au code", async () => {
    vi.mocked(prisma.commandeClient.findFirst).mockResolvedValueOnce(null);

    const res = await POST(ipnRequest(signedBody({ ref_command: "CMD-INCONNUE" })));

    expect(res.status).toBe(200);
    expect(prisma.commandeClient.update).not.toHaveBeenCalled();
    expect(prisma.commandeClient.updateMany).not.toHaveBeenCalled();
  });

  it("ne plante pas sur un custom_field JSON malformé", async () => {
    vi.mocked(prisma.commandeClient.findFirst).mockResolvedValueOnce(null);

    const res = await POST(
      ipnRequest(signedBody({ custom_field: "{pas-du-json" }))
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });
});

describe("POST /api/paytech/ipn — abonnements", () => {
  it("délègue au PaymentService quand custom_field indique un abonnement", async () => {
    const res = await POST(
      ipnRequest(
        signedBody({
          ref_command: "SUB-42",
          custom_field: JSON.stringify({
            kind: "subscription",
            transactionRef: "SUB-42",
          }),
        })
      )
    );

    expect(res.status).toBe(200);
    expect(PaymentService.handlePaymentWebhook).toHaveBeenCalledWith(
      "SUB-42",
      "SUCCESS"
    );
    expect(prisma.commandeClient.updateMany).not.toHaveBeenCalled();
  });

  it("détecte un abonnement via le préfixe SUB- même sans custom_field", async () => {
    const res = await POST(ipnRequest(signedBody({ ref_command: "SUB-999" })));

    expect(res.status).toBe(200);
    expect(PaymentService.handlePaymentWebhook).toHaveBeenCalledWith(
      "SUB-999",
      "SUCCESS"
    );
  });
});

describe("POST /api/paytech/ipn — autres événements", () => {
  it("accuse réception des événements non gérés sans rien écrire", async () => {
    const res = await POST(
      ipnRequest(signedBody({ type_event: "sale_canceled" }))
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });
    expect(prisma.commandeClient.updateMany).not.toHaveBeenCalled();
    expect(PaymentService.handlePaymentWebhook).not.toHaveBeenCalled();
  });
});
