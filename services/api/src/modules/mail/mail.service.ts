import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Resend } from 'resend';
import { AppConfig } from '../../config/app.config';
import { RESEND_CLIENT } from './mail.constants';

const VERIFICATION_SUBJECT = 'Confirma tu cuenta en Indenance';
const PASSWORD_RESET_SUBJECT = 'Restablece tu contraseña en Indenance';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(RESEND_CLIENT) private readonly client: Resend | null,
    private readonly config: AppConfig,
  ) {}

  get enabled(): boolean {
    return this.client !== null;
  }

  async sendVerificationEmail(
    to: string,
    name: string | undefined,
    link: string,
  ): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        'RESEND_API_KEY not configured, skipping verification email',
      );
      return;
    }

    const firstName = name?.split(' ')[0] ?? '';
    const greeting = firstName ? `Hola ${firstName},` : 'Hola,';

    await this.client.emails.send({
      from: this.config.emailFrom,
      to,
      subject: VERIFICATION_SUBJECT,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
          <h2>Confirma tu cuenta</h2>
          <p>${greeting}</p>
          <p>Para activar tu cuenta en Indenance, confirma tu dirección de correo haciendo click en el siguiente botón:</p>
          <p style="text-align:center;">
            <a href="${link}"
               style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
              Verificar mi email
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">
            Si no puedes ver el botón, copia y pega este enlace en tu navegador:<br/>
            ${link}
          </p>
          <p style="color:#6b7280;font-size:12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string | undefined,
    link: string,
  ): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        'RESEND_API_KEY not configured, skipping password reset email',
      );
      return;
    }

    const firstName = name?.split(' ')[0] ?? '';
    const greeting = firstName ? `Hola ${firstName},` : 'Hola,';

    await this.client.emails.send({
      from: this.config.emailFrom,
      to,
      subject: PASSWORD_RESET_SUBJECT,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
          <h2>Restablece tu contraseña</h2>
          <p>${greeting}</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Indenance. Haz click en el siguiente botón para elegir una nueva:</p>
          <p style="text-align:center;">
            <a href="${link}"
               style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">
            Si no puedes ver el botón, copia y pega este enlace en tu navegador:<br/>
            ${link}
          </p>
          <p style="color:#6b7280;font-size:12px;">El enlace expira en 1 hora. Si no solicitaste el cambio, puedes ignorar este correo.</p>
        </div>
      `,
    });
  }
}
