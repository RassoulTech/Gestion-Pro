import nodemailer from "nodemailer";

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

const emailFrom = process.env.SMTP_FROM || `GestionPro <${smtpUser}>`;

const isDevExposeLink = !transporter && process.env.NODE_ENV !== "production";

export type MailResult = { sent: boolean; devLink?: string };

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<MailResult> => {
  const confirmLink = `${domain}/verify-email?token=${token}`;

  if (!transporter) {
    console.warn("⚠️ SMTP non configuré. Email NON envoyé.");
    console.log(`Lien de vérification (DEV) : ${confirmLink}`);
    return { sent: false, devLink: isDevExposeLink ? confirmLink : undefined };
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: "Vérifiez votre adresse email",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff6b35;">Bienvenue sur GestionPro !</h1>
          <p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
          <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Confirmer mon compte</a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #ff6b35; font-size: 12px;">${confirmLink}</p>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    return { sent: false };
  }
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

/**
 * Envoie un mail à l'équipe support avec le contenu du formulaire de contact.
 * Le destinataire est `CONTACT_TO_EMAIL` si défini, sinon `SMTP_USER`.
 */
export const sendContactNotificationEmail = async (
  payload: ContactPayload
): Promise<MailResult> => {
  const to =
    process.env.CONTACT_TO_EMAIL || smtpUser || "contact@gestionpro.africa";

  if (!transporter) {
    console.warn("⚠️ SMTP non configuré. Notification contact NON envoyée.");
    console.log("Payload reçu :", payload);
    return { sent: false };
  }

  const nom = escapeHtml(payload.nom);
  const emailFromVisitor = escapeHtml(payload.email);
  const sujet = escapeHtml(payload.sujet);
  const message = escapeHtml(payload.message).replace(/\n/g, "<br/>");

  try {
    await transporter.sendMail({
      from: emailFrom,
      to,
      replyTo: payload.email,
      subject: `[Contact] ${payload.sujet}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff6b35;">Nouveau message via le formulaire de contact</h1>
          <p style="color: #444; font-size: 14px;">Vous avez reçu un nouveau message depuis la landing page GestionPro :</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 12px; background: #f7f7f7; font-weight: bold; width: 30%;">Nom</td>
              <td style="padding: 8px 12px; background: #fff;">${nom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f7f7f7; font-weight: bold;">Email</td>
              <td style="padding: 8px 12px; background: #fff;"><a href="mailto:${emailFromVisitor}" style="color: #ff6b35;">${emailFromVisitor}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f7f7f7; font-weight: bold;">Sujet</td>
              <td style="padding: 8px 12px; background: #fff;">${sujet}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #fafafa; border-left: 4px solid #ff6b35; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #444;">Message :</p>
            <p style="margin: 0; color: #222; line-height: 1.6;">${message}</p>
          </div>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">Répondez directement à cet email pour contacter le visiteur (Reply-To pré-rempli).</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification de contact :", error);
    return { sent: false };
  }
};

/**
 * Envoie un accusé de réception au visiteur après soumission du formulaire.
 */
export const sendContactAutoReplyEmail = async (
  payload: ContactPayload
): Promise<MailResult> => {
  if (!transporter) {
    return { sent: false };
  }

  const nom = escapeHtml(payload.nom);
  const sujet = escapeHtml(payload.sujet);

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: payload.email,
      subject: "Nous avons bien reçu votre message — GestionPro",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff6b35;">Merci ${nom} !</h1>
          <p style="color: #444; line-height: 1.6;">
            Nous avons bien reçu votre message concernant <strong>« ${sujet} »</strong>.
            Notre équipe vous répondra sous 24h ouvrées.
          </p>
          <p style="color: #444; line-height: 1.6; margin-top: 24px;">
            En attendant, n'hésitez pas à explorer la plateforme :
          </p>
          <p>
            <a href="${domain}" style="display: inline-block; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Découvrir GestionPro</a>
          </p>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
          </p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'auto-reply contact :", error);
    return { sent: false };
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<MailResult> => {
  const resetLink = `${domain}/reset-password?token=${token}`;

  if (!transporter) {
    console.warn("⚠️ SMTP non configuré. Email NON envoyé.");
    console.log(`Lien de reset (DEV) : ${resetLink}`);
    return { sent: false, devLink: isDevExposeLink ? resetLink : undefined };
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: "Réinitialisez votre mot de passe",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff6b35;">Réinitialisation de mot de passe</h1>
          <p>Vous avez demandé la réinitialisation de votre mot de passe GestionPro. Cliquez sur le bouton ci-dessous pour en créer un nouveau :</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Réinitialiser mon mot de passe</a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">Ce lien est valable pendant 1 heure. Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #ff6b35; font-size: 12px;">${resetLink}</p>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Votre mot de passe ne sera pas modifié.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de reset :", error);
    return { sent: false };
  }
};
