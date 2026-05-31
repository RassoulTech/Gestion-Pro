"use server";
// Touch file to trigger IDE TS cache reload for the new prisma client fields
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authActionClient } from "@/lib/safe-action";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";
import { generateBoutiqueQRCodeDataURL } from "@/lib/generate-qrcode-pdf";
import { logActivity } from "@/lib/activity-log";

const qrcodeSchema = z.object({
  boutiqueId: z.string().min(1),
});

export const generateBoutiqueQRCode = authActionClient
  .schema(qrcodeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId } = parsedInput;
    const { user } = ctx;

    // 1. Verify membership and ownership
    const membership = await prisma.membreBoutique.findFirst({
      where: {
        boutiqueId,
        vendeurId: user.vendeurId ?? "",
        role: "OWNER",
      },
      include: {
        boutique: true,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas le propriétaire de cette boutique.");
    }

    const boutique = membership.boutique;
    if (boutique.statut !== "ACTIF") {
      throw new Error("Cette boutique est actuellement désactivée ou suspendue.");
    }

    // 2. Verify Quotas / Plan Permissions (Pro or Enterprise only)
    const quotas = await getBoutiqueOwnerQuotas(boutiqueId);
    const hasAccess = quotas.codePlan === "PRO" || quotas.codePlan === "ENTERPRISE";
    
    if (!hasAccess) {
      throw new Error("Cette fonctionnalité est réservée aux forfaits Pro et Enterprise.");
    }

    // 3. Generate dynamic base64 QR Code pointing directly to public store page
    const qrCodeDataURL = await generateBoutiqueQRCodeDataURL(boutique.slug);

    // 4. Update the database Boutique row
    const updatedBoutique = await prisma.boutique.update({
      where: { id: boutiqueId },
      data: {
        qrCodeUrl: qrCodeDataURL,
        qrCodeGeneratedAt: new Date(),
      },
    });

    // 5. Audit log
    await logActivity({
      userId: user.id,
      action: "QR_CODE_GENERATED",
      subjectType: "Boutique",
      subjectId: boutiqueId,
    });

    return {
      success: true,
      qrCodeUrl: qrCodeDataURL,
      qrCodeGeneratedAt: updatedBoutique.qrCodeGeneratedAt,
    };
  });
