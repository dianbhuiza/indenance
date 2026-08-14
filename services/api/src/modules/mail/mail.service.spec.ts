import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from '../../config/app.config';
import { RESEND_CLIENT } from './mail.constants';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  describe('when a Resend client is provided', () => {
    let send: jest.Mock;

    beforeEach(async () => {
      send = jest.fn().mockResolvedValue({ id: 'email-1' });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: AppConfig,
            useValue: { emailFrom: 'Indenance <onboarding@resend.dev>' },
          },
          {
            provide: RESEND_CLIENT,
            useValue: { emails: { send } },
          },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    it('should be enabled', () => {
      expect(service.enabled).toBe(true);
    });

    it('should send the verification email', async () => {
      await service.sendVerificationEmail(
        'juan@example.com',
        'Juan Pérez',
        'https://app.example.com/auth/verify?token=abc',
      );

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Indenance <onboarding@resend.dev>',
          to: 'juan@example.com',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          subject: expect.stringContaining('Confirma tu cuenta'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          html: expect.stringContaining(
            'https://app.example.com/auth/verify?token=abc',
          ),
        }),
      );
    });
  });

  describe('when no Resend client is configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: AppConfig,
            useValue: { emailFrom: 'Indenance <onboarding@resend.dev>' },
          },
          { provide: RESEND_CLIENT, useValue: null },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    it('should be disabled', () => {
      expect(service.enabled).toBe(false);
    });

    it('should skip sending without throwing', async () => {
      await expect(
        service.sendVerificationEmail('juan@example.com', 'Juan', 'link'),
      ).resolves.toBeUndefined();
    });
  });
});
