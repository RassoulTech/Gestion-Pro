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
