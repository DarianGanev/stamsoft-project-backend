import { ConfigService } from '@nestjs/config';

import { PasswordResetMailer } from './password-reset-mailer.service';

describe('PasswordResetMailer', () => {
  it('treats placeholder SMTP values as local development mode', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          SMTP_HOST: 'smtp.example.com',
          SMTP_USER: 'your_username',
          SMTP_PASS: 'your_password',
        };

        return values[key];
      }),
    } as unknown as ConfigService;
    const mailer = new PasswordResetMailer(configService);

    await expect(
      mailer.sendPasswordReset({
        email: 'driver@example.com',
        resetLink: 'http://localhost:3000/reset-password?token=token',
      }),
    ).resolves.toBeUndefined();
  });
});
