import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

import { PasswordResetEmail } from './types';

@Injectable()
export class PasswordResetMailer {
  private readonly logger = new Logger(PasswordResetMailer.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordReset(input: PasswordResetEmail): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (this.hasMissingOrPlaceholderConfig(host, user, pass)) {
      this.logger.warn(
        `SMTP is not configured. Password reset link for ${input.email}: ${input.resetLink}`,
      );
      return;
    }

    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const from =
      this.configService.get<string>('SMTP_FROM') ?? 'CarAuction <no-reply@carauction.local>';

    const transport = createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transport.sendMail({
      from,
      to: input.email,
      subject: 'Reset your CarAuction password',
      text: `Use this link to reset your CarAuction password: ${input.resetLink}`,
      html: `<p>Use this link to reset your CarAuction password:</p><p><a href="${input.resetLink}">${input.resetLink}</a></p>`,
    });
  }

  private hasMissingOrPlaceholderConfig(
    host: string | undefined,
    user: string | undefined,
    pass: string | undefined,
  ): boolean {
    return (
      !host ||
      !user ||
      !pass ||
      host === 'smtp.example.com' ||
      user === 'your_username' ||
      pass === 'your_password'
    );
  }
}
