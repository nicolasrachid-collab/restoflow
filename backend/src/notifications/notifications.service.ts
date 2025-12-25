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

  // Método privado para integração futura com Twilio
  // private async sendViaTwilio(phone: string, message: string): Promise<NotificationResult> {
  //   // Implementação futura
  //   // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  //   // const result = await client.messages.create({...});
  //   // return { success: true, channel: NotificationChannel.SMS, messageId: result.sid };
  // }
}