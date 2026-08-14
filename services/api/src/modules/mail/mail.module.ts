import { Global, Module } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfig } from '../../config/app.config';
import { RESEND_CLIENT } from './mail.constants';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [
    MailService,
    {
      provide: RESEND_CLIENT,
      useFactory: (config: AppConfig) =>
        config.resendApiKey ? new Resend(config.resendApiKey) : null,
      inject: [AppConfig],
    },
  ],
  exports: [MailService],
})
export class MailModule {}
