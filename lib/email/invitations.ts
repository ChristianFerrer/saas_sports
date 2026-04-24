import { sendEmail, type EmailSendResult } from './resend';

type InvitationEmailArgs = {
  to: string;
  fullName: string;
  schoolName: string;
  role: 'admin' | 'coach' | 'parent';
  acceptUrl: string;
};

const ROLE_LABEL = {
  admin: 'administrador',
  coach: 'entrenador',
  parent: 'padre/madre'
} as const;

function htmlBody({ fullName, schoolName, role, acceptUrl }: InvitationEmailArgs): string {
  return `<!doctype html>
<html lang="es">
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hola ${fullName},</p>
  <p>
    <strong>${schoolName}</strong> te ha invitado a SmartSpots como
    <strong>${ROLE_LABEL[role]}</strong>.
  </p>
  <p>
    <a href="${acceptUrl}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:500;">
      Aceptar invitación
    </a>
  </p>
  <p style="color:#555;font-size:13px;">
    Si el botón no funciona, copia y pega esta dirección en tu navegador:<br>
    <span style="word-break:break-all;">${acceptUrl}</span>
  </p>
  <p style="color:#888;font-size:12px;">
    Este enlace caduca en 7 días. Si no esperabas este correo puedes ignorarlo.
  </p>
</body>
</html>`;
}

function textBody({ fullName, schoolName, role, acceptUrl }: InvitationEmailArgs): string {
  return `Hola ${fullName},

${schoolName} te ha invitado a SmartSpots como ${ROLE_LABEL[role]}.

Acepta la invitación aquí:
${acceptUrl}

Este enlace caduca en 7 días.`;
}

export async function sendInvitationEmail(
  args: InvitationEmailArgs
): Promise<EmailSendResult> {
  return sendEmail({
    to: args.to,
    subject: `Te han invitado a ${args.schoolName} en SmartSpots`,
    html: htmlBody(args),
    text: textBody(args)
  });
}
