import { Injectable, Logger } from '@nestjs/common';
import * as twilio from 'twilio';
import * as nodemailer from 'nodemailer';
import { NotificationTemplatesService } from './notification-templates.service';

export enum NotificationChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly useMock = process.env.NOTIFICATIONS_MOCK === 'true';
  private twilioClient: twilio.Twilio | null = null;
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly templatesService: NotificationTemplatesService,
  ) {
    // Inicializar Twilio se configurado
    if (!this.useMock && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );
        this.logger.log('✅ Twilio inicializado com sucesso');
      } catch (error) {
        this.logger.error('❌ Erro ao inicializar Twilio:', error);
      }
    }

    // Inicializar Nodemailer se configurado
    if (!this.useMock && process.env.SMTP_HOST) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        this.logger.log('✅ Nodemailer inicializado com sucesso');
      } catch (error) {
        this.logger.error('❌ Erro ao inicializar Nodemailer:', error);
      }
    }
  }

  async sendQueueAlert(
    phone: string,
    customerName: string,
    restaurantName: string,
    channel: NotificationChannel = NotificationChannel.SMS,
  ): Promise<NotificationResult> {
    const template = this.templatesService.getQueueAlertTemplate(
      channel as 'SMS' | 'WHATSAPP' | 'EMAIL',
      { customerName, restaurantName },
    );
    const message = template.body;

    if (this.useMock) {
      this.logger.log(`📱 [MOCK ${channel}] Para: ${phone}`);
      this.logger.log(`   Mensagem: ${message}`);
      return {
        success: true,
        channel,
        messageId: `mock-${Date.now()}`,
      };
    }

    // Enviar via canal real
    if (channel === NotificationChannel.SMS) {
      return await this.sendSMS(phone, message);
    } else if (channel === NotificationChannel.WHATSAPP) {
      return await this.sendWhatsApp(phone, message);
    } else if (channel === NotificationChannel.EMAIL) {
      // Para email, precisamos do endereço de email
      return {
        success: false,
        channel,
        error: 'Email requer endereço de email. Use sendEmail() diretamente.',
      };
    } else {
      this.logger.warn(`⚠️ Canal ${channel} não suportado para alerta de fila. Usando SMS.`);
      return await this.sendSMS(phone, message);
    }
  }

  async sendReservationConfirmation(
    phone: string,
    customerName: string,
    date: Date,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
    restaurantName?: string,
    partySize?: number,
  ): Promise<NotificationResult> {
    const template = this.templatesService.getReservationConfirmationTemplate(
      channel as 'SMS' | 'WHATSAPP' | 'EMAIL',
      { customerName, reservationDate: date, restaurantName, partySize },
    );
    const message = template.body;

    if (this.useMock) {
      this.logger.log(`📅 [MOCK ${channel}] Para: ${phone}`);
      this.logger.log(`   Mensagem: ${message}`);
      return {
        success: true,
        channel,
        messageId: `mock-${Date.now()}`,
      };
    }

    // Enviar via canal real
    if (channel === NotificationChannel.WHATSAPP) {
      return await this.sendWhatsApp(phone, message);
    } else if (channel === NotificationChannel.SMS) {
      return await this.sendSMS(phone, message);
    } else if (channel === NotificationChannel.EMAIL) {
      // Para email, precisamos do endereço de email
      return {
        success: false,
        channel,
        error: 'Email requer endereço de email. Use sendEmail() diretamente.',
      };
    } else {
      this.logger.warn(`⚠️ Canal ${channel} não suportado para confirmação de reserva. Usando WhatsApp.`);
      return await this.sendWhatsApp(phone, message);
    }
  }

  async sendEmail(
    email: string,
    subject: string,
    body: string,
    htmlBody?: string,
  ): Promise<NotificationResult> {
    if (this.useMock || !this.emailTransporter) {
      this.logger.log(`📧 [MOCK EMAIL] Para: ${email}`);
      this.logger.log(`   Assunto: ${subject}`);
      this.logger.log(`   Mensagem: ${body}`);
      
      return {
        success: true,
        channel: NotificationChannel.EMAIL,
        messageId: `email-mock-${Date.now()}`,
      };
    }

    try {
      const info = await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        text: body,
        html: htmlBody || body.replace(/\n/g, '<br>'),
      });

      this.logger.log(`✅ Email enviado com sucesso para ${email}. MessageId: ${info.messageId}`);
      
      return {
        success: true,
        channel: NotificationChannel.EMAIL,
        messageId: info.messageId,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar email para ${email}:`, error);
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        error: error.message || 'Erro desconhecido ao enviar email',
      };
    }
  }

  async sendWhatsApp(
    phone: string,
    message: string,
  ): Promise<NotificationResult> {
    if (this.useMock || !this.twilioClient) {
      this.logger.log(`💬 [MOCK WHATSAPP] Para: ${phone}`);
      this.logger.log(`   Mensagem: ${message}`);
      
      return {
        success: true,
        channel: NotificationChannel.WHATSAPP,
        messageId: `whatsapp-mock-${Date.now()}`,
      };
    }

    try {
      const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const formattedPhone = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
      
      const result = await this.twilioClient.messages.create({
        from: twilioWhatsAppNumber,
        to: formattedPhone,
        body: message,
      });

      this.logger.log(`✅ WhatsApp enviado com sucesso para ${phone}. SID: ${result.sid}`);
      
      return {
        success: true,
        channel: NotificationChannel.WHATSAPP,
        messageId: result.sid,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar WhatsApp para ${phone}:`, error);
      return {
        success: false,
        channel: NotificationChannel.WHATSAPP,
        error: error.message || 'Erro desconhecido ao enviar WhatsApp',
      };
    }
  }

  async sendSMS(
    phone: string,
    message: string,
  ): Promise<NotificationResult> {
    if (this.useMock || !this.twilioClient) {
      this.logger.log(`📱 [MOCK SMS] Para: ${phone}`);
      this.logger.log(`   Mensagem: ${message}`);
      
      return {
        success: true,
        channel: NotificationChannel.SMS,
        messageId: `sms-mock-${Date.now()}`,
      };
    }

    try {
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!twilioPhoneNumber) {
        throw new Error('TWILIO_PHONE_NUMBER não configurado');
      }

      const result = await this.twilioClient.messages.create({
        from: twilioPhoneNumber,
        to: phone,
        body: message,
      });

      this.logger.log(`✅ SMS enviado com sucesso para ${phone}. SID: ${result.sid}`);
      
      return {
        success: true,
        channel: NotificationChannel.SMS,
        messageId: result.sid,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar SMS para ${phone}:`, error);
      return {
        success: false,
        channel: NotificationChannel.SMS,
        error: error.message || 'Erro desconhecido ao enviar SMS',
      };
    }
  }
}