// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paiement: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    abonnement: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/mail", () => ({
  sendSubscriptionActivatedEmailToClient: vi.fn().mockResolvedValue(undefined),
  sendSubscriptionAlertToAdmin: vi.fn().mockResolvedValue(undefined),
}));

import { PaymentService } from "@/server/services/payment.service";
import { prisma } from "@/lib/prisma";
import {
  sendSubscriptionActivatedEmailToClient,
  sendSubscriptionAlertToAdmin,
} from "@/lib/mail";

const NOW = new Date("2026-06-12T10:00:00.000Z");
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type PaiementFixture = {
  statut?: string;
  planNom?: string;
  dateDebut?: Date | null;
  dateFin?: Date | null;
};

function buildPaiement({
  statut = "EN_ATTENTE",
  planNom = "Pro",
  dateDebut = null,
  dateFin = null,
}: PaiementFixture = {}) {
  return {
    id: "pay-1",
    statut,
    montant: 15000,
    abonnementId: "ab-1",
    abonnement: {
      id: "ab-1",
      dateDebut,
      dateFin,
      plan: { id: "plan-1", nom: planNom },
      vendeur: {
        email: "vendeur@example.sn",
        prenom: "Awa",
        nom: "Ndiaye",
        boutiques: [{ nom: "Chez Awa" }],
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PaymentService.handlePaymentWebhook — garde-fous", () => {
  it("lève une erreur si la référence de transaction est inconnue", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(null);

    await expect(
      PaymentService.handlePaymentWebhook("SUB-INCONNU", "SUCCESS")
    ).rejects.toThrow("SUB-INCONNU");

    expect(prisma.paiement.update).not.toHaveBeenCalled();
    expect(prisma.abonnement.update).not.toHaveBeenCalled();
  });

  it("est idempotent : un paiement déjà confirmé n'est jamais re-muté", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({ statut: "CONFIRME" }) as never
    );

    const result = await PaymentService.handlePaymentWebhook("SUB-1", "SUCCESS");

    expect(result.success).toBe(true);
    expect(prisma.paiement.update).not.toHaveBeenCalled();
    expect(prisma.abonnement.update).not.toHaveBeenCalled();
    expect(sendSubscriptionActivatedEmailToClient).not.toHaveBeenCalled();
  });

  it("un FAILED rejoué sur un paiement déjà en échec ne re-mute rien", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({ statut: "ECHOUE" }) as never
    );

    const result = await PaymentService.handlePaymentWebhook("SUB-1", "FAILED");

    expect(result.success).toBe(false);
    expect(prisma.paiement.update).not.toHaveBeenCalled();
    expect(prisma.abonnement.update).not.toHaveBeenCalled();
  });

  it("un FAILED ne rétrograde jamais un paiement déjà confirmé", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({ statut: "CONFIRME" }) as never
    );

    const result = await PaymentService.handlePaymentWebhook("SUB-1", "FAILED");

    expect(result.success).toBe(true);
    expect(prisma.paiement.update).not.toHaveBeenCalled();
    expect(prisma.abonnement.update).not.toHaveBeenCalled();
  });
});

describe("PaymentService.handlePaymentWebhook — succès", () => {
  it("active l'abonnement pour 30 jours à partir de maintenant si expiré", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({
        dateDebut: new Date("2026-01-01T00:00:00.000Z"),
        dateFin: new Date("2026-05-01T00:00:00.000Z"), // expiré
      }) as never
    );

    const result = await PaymentService.handlePaymentWebhook("SUB-1", "SUCCESS");

    expect(result.success).toBe(true);
    expect(prisma.paiement.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { statut: "CONFIRME" },
    });
    expect(prisma.abonnement.update).toHaveBeenCalledWith({
      where: { id: "ab-1" },
      data: {
        statut: "ACTIF",
        dateDebut: new Date("2026-01-01T00:00:00.000Z"),
        dateFin: new Date(NOW.getTime() + THIRTY_DAYS_MS),
      },
    });
  });

  it("cumule le temps restant : un renouvellement anticipé prolonge depuis dateFin", async () => {
    const dateFinFuture = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000); // +10 jours

    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({
        dateDebut: new Date("2026-06-01T00:00:00.000Z"),
        dateFin: dateFinFuture,
      }) as never
    );

    await PaymentService.handlePaymentWebhook("SUB-1", "SUCCESS");

    expect(prisma.abonnement.update).toHaveBeenCalledWith({
      where: { id: "ab-1" },
      data: expect.objectContaining({
        // 10 jours restants + 30 jours achetés = 40 jours au total
        dateFin: new Date(dateFinFuture.getTime() + THIRTY_DAYS_MS),
      }),
    });
  });

  it("initialise dateDebut à maintenant pour une première activation", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({ dateDebut: null, dateFin: null }) as never
    );

    await PaymentService.handlePaymentWebhook("SUB-1", "SUCCESS");

    expect(prisma.abonnement.update).toHaveBeenCalledWith({
      where: { id: "ab-1" },
      data: expect.objectContaining({ dateDebut: NOW }),
    });
  });

  it("envoie les emails d'activation pour un plan Pro", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({ planNom: "Pro" }) as never
    );

    await PaymentService.handlePaymentWebhook("SUB-1", "SUCCESS");

    expect(sendSubscriptionActivatedEmailToClient).toHaveBeenCalledWith(
      "vendeur@example.sn",
      "Awa",
      "Pro",
      expect.any(Date)
    );
    expect(sendSubscriptionAlertToAdmin).toHaveBeenCalledWith(
      "Chez Awa",
      "Pro",
      15000,
      "Awa Ndiaye",
      "vendeur@example.sn"
    );
  });

  it("n'envoie pas d'email pour un plan gratuit", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement({ planNom: "Découverte" }) as never
    );

    await PaymentService.handlePaymentWebhook("SUB-1", "SUCCESS");

    expect(sendSubscriptionActivatedEmailToClient).not.toHaveBeenCalled();
    expect(sendSubscriptionAlertToAdmin).not.toHaveBeenCalled();
  });
});

describe("PaymentService.handlePaymentWebhook — échec", () => {
  it("marque le paiement en échec et annule l'abonnement", async () => {
    vi.mocked(prisma.paiement.findFirst).mockResolvedValueOnce(
      buildPaiement() as never
    );

    const result = await PaymentService.handlePaymentWebhook("SUB-1", "FAILED");

    expect(result.success).toBe(false);
    expect(prisma.paiement.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { statut: "ECHOUE" },
    });
    expect(prisma.abonnement.update).toHaveBeenCalledWith({
      where: { id: "ab-1" },
      data: { statut: "ANNULE" },
    });
  });
});
