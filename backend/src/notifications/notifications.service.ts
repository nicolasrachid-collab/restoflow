import { Injectable, Logger } from '@nestjs/common';

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
  private readonly useMock = process.env.NOTIFICATIONS_MOCK === 'true' || !process.env.TWILIO_ACCOUNT_SID;

  async sendQueueAlert(
    phone: string,
    customerName: string,
    restaurantName: string,
    channel: NotificationChannel = NotificationChannel.SMS,
  ): Promise<NotificationResult> {
    const message = `Olá ${customerName}, sua mesa no ${restaurantName} está pronta! Por favor, dirija-se à recepção.`;

    if (this.useMock) {
      this.logger.log(`📱 [MOCK ${channel}] Para: ${phone}`);
      this.logger.log(`   Mensagem: ${message}`);
      return {
        success: true,
        channel,
        messageId: `mock-${Date.now()}`,
      };
    }

    // Em produção, implementar integração real aqui
    // Exemplo com Twilio:
    // return await this.sendViaTwilio(phone, message);
    
    // Por enquanto, retorna mock mesmo se configurado
    this.logger.warn('⚠️ Notificações reais não implementadas. Usando mock.');
    return this.sendQueueAlert(phone, customerName, restaurantName, channel);
  }

  async sendReservationConfirmation(
    phone: string,
    customerName: string,
    date: Date,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
  ): Promise<NotificationResult> {
    const message = `${customerName}, sua reserva para ${date.toLocaleString('pt-BR')} foi confirmada.`;

    if (this.useMock) {
      this.logger.log(`📅 [MOCK ${channel}] Para: ${phone}`);
      this.logger.log(`   Mensagem: ${message}`);
      return {
        success: true,
        channel,
        messageId: `mock-${Date.now()}`,
      };
    }

    // Em produção, implementar integração real aqui
    this.logger.warn('⚠️ Notificações reais não implementadas. Usando mock.');
    return this.sendReservationConfirmation(phone, customerName, date, channel);
  }

  async sendEmail(
    email: string,
    subject: string,
    body: string,
  ): Promise<NotificationResult> {
    // Por enquanto, mock. Em produção, implementar com Nodemailer, SendGrid, etc.
    if (this.useMock || !process.env.SMTP_HOST) {
      this.logger.log(`📧 [MOCK EMAIL] Para: ${email}`);
      this.logger.log(`   Assunto: ${subject}`);
      this.logger.log(`   Mensagem: ${body}`);
      
      return {
        success: true,
        channel: NotificationChannel.EMAIL,
        messageId: `email-mock-${Date.now()}`,
      };
    }

    // Implementação futura com Nodemailer ou SendGrid
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({ to: email, subject, text: body });
    
    this.logger.warn('⚠️ Envio de email real não implementado. Usando mock.');
    return this.sendEmail(email, subject, body);
  }

  async sendWhatsApp(
    phone: string,
    message: string,
  ): Promise<NotificationResult> {
    // Por enquanto, mock. Em produção, implementar com Twilio WhatsApp API ou WhatsApp Business API
    if (this.useMock || !process.env.TWILIO_ACCOUNT_SID) {
      this.logger.log(`💬 [MOCK WHATSAPP] Para: ${phone}`);
      this.logger.log(`   Mensagem: ${message}`);
      
      return {
        success: true,
        channel: NotificationChannel.WHATSAPP,
        messageId: `whatsapp-mock-${Date.now()}`,
      };
    }

    // Implementação futura com Twilio WhatsApp API
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const result = await client.messages.create({
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:${phone}`,
    //   body: message,
    // });
    // return { success: true, channel: NotificationChannel.WHATSAPP, messageId: result.sid };
    
    this.logger.warn('⚠️ Envio de WhatsApp real não implementado. Usando mock.');
    return this.sendWhatsApp(phone, message);
  }

  // Método privado para integração futura com Twilio
  // private async sendViaTwilio(phone: string, message: string): Promise<NotificationResult> {
  //   // Implementação futura
  //   // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  //   // const result = await client.messages.create({...});
  //   // return { success: true, channel: NotificationChannel.SMS, messageId: result.sid };
  // }
}