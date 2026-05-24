import nodemailer from "nodemailer";

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const emailFrom = process.env.SMTP_EMAIL ? `GestionPro <${process.env.SMTP_EMAIL}>` : "GestionPro <no-reply@gestionpro.com>";

export type MailResult = { sent: boolean; devLink?: string; error?: string };

/**
 * Indique si le pipeline d'envoi d'email est opérationnel.
 */
export function isMailConfigured(): boolean {
  return !!process.env.SMTP_EMAIL && !!process.env.SMTP_PASSWORD;
}

const isDevExposeLink = !isMailConfigured() && process.env.NODE_ENV !== "production";

/**
 * Wrapper unifié autour de Nodemailer qui normalise le format `{ sent, error }`
 */
async function sendViaNodemailer(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<MailResult> {
  if (!isMailConfigured()) {
    return { sent: false, error: "SMTP credentials not set" };
  }
  try {
    await transporter.sendMail({
      from: emailFrom,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mail] nodemailer exception:", msg);
    return { sent: false, error: msg };
  }
}

// --- Premium Shared Email Header & Footer Generators ---
const getEmailWrapper = (title: string, content: string, footerNote?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;">
              <!-- Beautiful Brand Orange Gradient Header Bar -->
              <tr>
                <td style="background: linear-gradient(135deg, #ea580c 0%, #7c2d12 100%); height: 8px;"></td>
              </tr>
              
              <!-- Brand Identity Section -->
              <tr>
                <td align="center" style="padding: 40px 40px 20px 40px;">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <div style="display: flex; align-items: center; justify-content: center; height: 52px; width: 52px; background: linear-gradient(135deg, #ea580c 0%, #7c2d12 100%); border-radius: 16px; margin-bottom: 16px; box-shadow: 0 8px 16px -4px rgba(234, 88, 12, 0.25);">
                          <span style="font-family: sans-serif; font-size: 26px; font-weight: 900; color: #ffffff; line-height: 52px; text-align: center; display: block; width: 52px;">G</span>
                        </div>
                        <span style="display: block; font-size: 20px; font-weight: 900; tracking-spacing: -0.025em; color: #0f172a; margin-top: 10px;">Gestion<span style="color: #ea580c;">Pro</span></span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Core Content Section -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; font-size: 15px; line-height: 1.6; color: #334155;">
                  ${content}
                </td>
              </tr>

              <!-- Premium Divider -->
              <tr>
                <td style="padding: 0 40px;">
                  <div style="border-top: 1px solid #f1f5f9;"></div>
                </td>
              </tr>

              <!-- Elegant Footnote -->
              <tr>
                <td style="padding: 30px 40px 40px 40px; text-align: center;">
                  <p style="margin: 0 0 16px 0; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                    GestionPro — Digitalisez votre commerce en Afrique
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                    ${footerNote ?? "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité."}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Outer Bottom Info -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin-top: 24px;">
              <tr>
                <td align="center" style="font-size: 12px; color: #94a3b8; font-weight: 500; line-height: 1.5;">
                  Dakar, Sénégal &amp; Abidjan, Côte d'Ivoire<br/>
                  © ${new Date().getFullYear()} GestionPro. Tous droits réservés.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<MailResult> => {
  const confirmLink = `${domain}/verify-email?token=${token}`;

  if (!isMailConfigured()) {
    console.warn("[mail] Nodemailer not configured. Email skipped.");
    console.log(`Lien généré (DEV) : ${confirmLink}`);
    return { sent: false, devLink: isDevExposeLink ? confirmLink : undefined };
  }

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center;">
      Activez votre compte GestionPro
    </h2>
    <p style="margin: 0 0 24px 0; text-align: center; font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.6;">
      Bienvenue à bord ! Nous sommes ravis de vous compter parmi nous. Pour finaliser la création de votre compte et démarrer l'aventure, veuillez vérifier votre adresse email.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ea580c 0%, #7c2d12 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.4); transition: all 0.2s ease;">
        Confirmer mon adresse email
      </a>
    </div>
    <div style="margin-top: 32px; padding: 16px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
        Un problème avec le bouton ?
      </p>
      <p style="margin: 0; font-size: 13px; color: #ea580c; font-weight: 600; word-break: break-all;">
        <a href="${confirmLink}" style="color: #ea580c; text-decoration: none;">${confirmLink}</a>
      </p>
    </div>
  `;

  return sendViaNodemailer({
    to: email,
    subject: "Vérifiez votre adresse email — GestionPro",
    html: getEmailWrapper("Vérifiez votre adresse email", htmlContent),
  });
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type ContactPayload = {
  nom: string;
  email: string;
  sujet: string;
  message: string;
};

export const sendContactNotificationEmail = async (
  payload: ContactPayload
): Promise<MailResult> => {
  const to =
    process.env.CONTACT_TO_EMAIL || "dionemhd1@gmail.com";

  if (!isMailConfigured()) {
    console.warn("[mail] Resend not configured. Contact notification skipped.");
    console.log("Payload reçu :", payload);
    return { sent: false };
  }

  const nom = escapeHtml(payload.nom);
  const emailFromVisitor = escapeHtml(payload.email);
  const sujet = escapeHtml(payload.sujet);
  const message = escapeHtml(payload.message).replace(/\n/g, "<br/>");

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a; border-left: 4px solid #ea580c; padding-left: 12px;">
      Nouveau message visiteur
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; font-weight: 500;">
      Un visiteur a soumis un message depuis le formulaire de contact de la landing page.
    </p>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 16px; background-color: #f8fafc; font-size: 13px; font-weight: 700; color: #64748b; width: 25%; border-radius: 12px 0 0 0; border-bottom: 1px solid #f1f5f9;">Visiteur</td>
        <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${nom}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f8fafc; font-size: 13px; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Adresse Email</td>
        <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #ea580c; border-bottom: 1px solid #f1f5f9;">
          <a href="mailto:${emailFromVisitor}" style="color: #ea580c; text-decoration: none;">${emailFromVisitor}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f8fafc; font-size: 13px; font-weight: 700; color: #64748b; border-radius: 0 0 0 12px;">Sujet</td>
        <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #1e293b;">${sujet}</td>
      </tr>
    </table>

    <div style="padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 1px solid #e2e8f0; margin-top: 16px;">
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Message :</p>
      <p style="margin: 0; color: #1e293b; line-height: 1.7; font-size: 14px; font-weight: 500;">
        ${message}
      </p>
    </div>
  `;

  return sendViaNodemailer({
    to,
    replyTo: payload.email,
    subject: `[Contact Landing] ${payload.sujet} — ${payload.nom}`,
    html: getEmailWrapper("Nouveau message contact", htmlContent, "Vous pouvez répondre directement à cet email pour recontacter le visiteur."),
  });
};

export const sendContactAutoReplyEmail = async (
  payload: ContactPayload
): Promise<MailResult> => {
  if (!isMailConfigured()) {
    return { sent: false };
  }

  const nom = escapeHtml(payload.nom);
  const sujet = escapeHtml(payload.sujet);

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center;">
      Bonjour ${nom} !
    </h2>
    <p style="margin: 0 0 24px 0; text-align: center; font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.6;">
      Nous avons bien reçu votre demande concernant le sujet <strong>« ${sujet} »</strong>. Notre équipe étudie votre demande et vous recontactera sous 24 heures ouvrées.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${domain}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ea580c 0%, #7c2d12 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.4); transition: all 0.2s ease;">
        Visiter notre site web
      </a>
    </div>

    <p style="margin: 32px 0 0 0; text-align: center; font-size: 13px; color: #94a3b8; font-weight: 600; line-height: 1.5;">
      À très bientôt,<br/>
      L'équipe de support client GestionPro.
    </p>
  `;

  return sendViaNodemailer({
    to: payload.email,
    subject: "Nous avons bien reçu votre message — GestionPro",
    html: getEmailWrapper("Accusé de réception", htmlContent),
  });
};

type SubscriptionEmailContext = {
  email: string;
  vendeurName?: string | null;
  planName: string;
  expiresAt: Date;
  amount: number;
  boutiqueId?: string | null;
};

const renewLink = (boutiqueId?: string | null) =>
  boutiqueId
    ? `${domain}/boutiques/${boutiqueId}/facturation`
    : `${domain}/boutiques`;

export const sendSubscriptionRenewalReminderEmail = async (
  ctx: SubscriptionEmailContext
): Promise<MailResult> => {
  if (!isMailConfigured()) {
    console.warn("[mail] Resend not configured. Renewal reminder skipped.");
    console.log("Rappel renouvellement (DEV) :", ctx);
    return { sent: false };
  }

  const greet = escapeHtml(ctx.vendeurName || "Cher abonné");
  const planName = escapeHtml(ctx.planName);
  const formattedDate = ctx.expiresAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedAmount = `${ctx.amount.toLocaleString("fr-FR")} FCFA`;
  const cta = renewLink(ctx.boutiqueId);

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center;">
      ${greet}, votre abonnement expire bientôt
    </h2>
    <p style="margin: 0 0 24px 0; text-align: center; font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.6;">
      Votre forfait <strong>${planName}</strong> arrive à échéance le <strong>${formattedDate}</strong>.
      Pour continuer à profiter sans interruption de GestionPro, renouvelez dès maintenant pour <strong>${formattedAmount}</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${cta}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ea580c 0%, #7c2d12 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.4);">
        Renouveler maintenant
      </a>
    </div>
    <div style="margin-top: 32px; padding: 16px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
        Modes de paiement acceptés
      </p>
      <p style="margin: 0; font-size: 13px; color: #475569; font-weight: 600;">
        Wave, Orange Money (via PayDunya) ou carte bancaire (Stripe).
      </p>
    </div>
  `;

  return sendViaNodemailer({
    to: ctx.email,
    subject: `Votre abonnement ${ctx.planName} expire le ${formattedDate} — GestionPro`,
    html: getEmailWrapper("Rappel de renouvellement", htmlContent),
  });
};

export const sendSubscriptionExpiredEmail = async (
  ctx: SubscriptionEmailContext
): Promise<MailResult> => {
  if (!isMailConfigured()) {
    console.warn("[mail] Resend not configured. Subscription expired email skipped.");
    console.log("Expiration abonnement (DEV) :", ctx);
    return { sent: false };
  }

  const greet = escapeHtml(ctx.vendeurName || "Cher abonné");
  const planName = escapeHtml(ctx.planName);
  const formattedAmount = `${ctx.amount.toLocaleString("fr-FR")} FCFA`;
  const cta = renewLink(ctx.boutiqueId);

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center;">
      ${greet}, votre abonnement a expiré
    </h2>
    <p style="margin: 0 0 24px 0; text-align: center; font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.6;">
      Votre forfait <strong>${planName}</strong> est arrivé à échéance. Vos données restent en sécurité,
      mais certaines fonctionnalités premium sont désormais limitées tant que vous n'avez pas renouvelé.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${cta}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 8px 20px -6px rgba(239, 68, 68, 0.4);">
        Réactiver pour ${formattedAmount}
      </a>
    </div>
    <p style="margin: 24px 0 0 0; text-align: center; font-size: 13px; color: #94a3b8; font-weight: 600; line-height: 1.6;">
      Une question ? Répondez simplement à cet email, notre support vous recontacte sous 24h.
    </p>
  `;

  return sendViaNodemailer({
    to: ctx.email,
    subject: `Abonnement ${ctx.planName} expiré — réactivez votre compte GestionPro`,
    html: getEmailWrapper("Abonnement expiré", htmlContent),
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<MailResult> => {
  const resetLink = `${domain}/reset-password?token=${token}`;

  if (!isMailConfigured()) {
    console.warn("[mail] Resend not configured. Password reset email skipped.");
    console.log(`Lien de reset (DEV) : ${resetLink}`);
    return { sent: false, devLink: isDevExposeLink ? resetLink : undefined };
  }

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center;">
      Réinitialisation de mot de passe
    </h2>
    <p style="margin: 0 0 24px 0; text-align: center; font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe pour votre compte GestionPro. Cliquez sur le bouton ci-dessous pour configurer un nouveau mot de passe.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ea580c 0%, #7c2d12 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.4); transition: all 0.2s ease;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    
    <div style="margin-top: 32px; padding: 16px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
        Ce lien expirera dans 1 heure. Un problème de bouton ?
      </p>
      <p style="margin: 0; font-size: 13px; color: #ea580c; font-weight: 600; word-break: break-all;">
        <a href="${resetLink}" style="color: #ea580c; text-decoration: none;">${resetLink}</a>
      </p>
    </div>
  `;

  return sendViaNodemailer({
    to: email,
    subject: "Réinitialisez votre mot de passe — GestionPro",
    html: getEmailWrapper("Réinitialisation de mot de passe", htmlContent),
  });
};
