import { Injectable } from '@nestjs/common';

export interface TemplateVariables {
  customerName?: string;
  restaurantName?: string;
  date?: Date;
  time?: string;
  partySize?: number;
  position?: number;
  estimatedWaitMinutes?: number;
  reservationDate?: Date;
  [key: string]: any;
}

@Injectable()
export class NotificationTemplatesService {
  /**
   * Template para alerta de fila (quando está próximo)
   */
  getQueueAlertTemplate(
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL',
    variables: TemplateVariables,
  ): { subject?: string; body: string; htmlBody?: string } {
    const { customerName, restaurantName, position, estimatedWaitMinutes } = variables;
    
    const textBody = `Olá ${customerName}, sua mesa no ${restaurantName} está pronta! Por favor, dirija-se à recepção.`;
    
    if (channel === 'EMAIL') {
      return {
        subject: `Sua mesa está pronta - ${restaurantName}`,
        body: textBody,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Sua mesa está pronta!</h2>
            <p>Olá ${customerName},</p>
            <p>Sua mesa no <strong>${restaurantName}</strong> está pronta!</p>
            <p>Por favor, dirija-se à recepção.</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Atenciosamente,<br>
              Equipe ${restaurantName}
            </p>
          </div>
        `,
      };
    }
    
    return { body: textBody };
  }

  /**
   * Template para notificação de posição na fila
   */
  getQueuePositionTemplate(
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL',
    variables: TemplateVariables,
  ): { subject?: string; body: string; htmlBody?: string } {
    const { customerName, restaurantName, position, estimatedWaitMinutes } = variables;
    
    let textBody = `Olá ${customerName}, você está na posição ${position} na fila do ${restaurantName}.`;
    if (estimatedWaitMinutes) {
      textBody += ` Tempo estimado: ${estimatedWaitMinutes} minutos.`;
    }
    
    if (channel === 'EMAIL') {
      return {
        subject: `Sua posição na fila - ${restaurantName}`,
        body: textBody,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Sua posição na fila</h2>
            <p>Olá ${customerName},</p>
            <p>Você está na <strong>posição ${position}</strong> na fila do <strong>${restaurantName}</strong>.</p>
            ${estimatedWaitMinutes ? `<p>Tempo estimado de espera: <strong>${estimatedWaitMinutes} minutos</strong>.</p>` : ''}
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Atenciosamente,<br>
              Equipe ${restaurantName}
            </p>
          </div>
        `,
      };
    }
    
    return { body: textBody };
  }

  /**
   * Template para confirmação de reserva
   */
  getReservationConfirmationTemplate(
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL',
    variables: TemplateVariables,
  ): { subject?: string; body: string; htmlBody?: string } {
    const { customerName, restaurantName, reservationDate, partySize } = variables;
    const dateStr = reservationDate 
      ? new Date(reservationDate).toLocaleString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'data não informada';
    
    const textBody = `${customerName}, sua reserva para ${dateStr} no ${restaurantName} foi confirmada.${partySize ? ` Mesa para ${partySize} pessoas.` : ''}`;
    
    if (channel === 'EMAIL') {
      return {
        subject: `Reserva confirmada - ${restaurantName}`,
        body: textBody,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Reserva Confirmada!</h2>
            <p>Olá ${customerName},</p>
            <p>Sua reserva foi confirmada com sucesso!</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Data e Hora:</strong> ${dateStr}</p>
              ${partySize ? `<p><strong>Número de pessoas:</strong> ${partySize}</p>` : ''}
              <p><strong>Restaurante:</strong> ${restaurantName}</p>
            </div>
            <p>Estamos ansiosos para recebê-lo!</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Atenciosamente,<br>
              Equipe ${restaurantName}
            </p>
          </div>
        `,
      };
    }
    
    return { body: textBody };
  }

  /**
   * Template para lembrete de reserva
   */
  getReservationReminderTemplate(
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL',
    variables: TemplateVariables,
  ): { subject?: string; body: string; htmlBody?: string } {
    const { customerName, restaurantName, reservationDate, partySize } = variables;
    const dateStr = reservationDate 
      ? new Date(reservationDate).toLocaleString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'data não informada';
    
    const textBody = `Olá ${customerName}, lembramos que você tem uma reserva no ${restaurantName} para ${dateStr}.${partySize ? ` Mesa para ${partySize} pessoas.` : ''} Esperamos você!`;
    
    if (channel === 'EMAIL') {
      return {
        subject: `Lembrete de Reserva - ${restaurantName}`,
        body: textBody,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Lembrete de Reserva</h2>
            <p>Olá ${customerName},</p>
            <p>Lembramos que você tem uma reserva confirmada:</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Data e Hora:</strong> ${dateStr}</p>
              ${partySize ? `<p><strong>Número de pessoas:</strong> ${partySize}</p>` : ''}
              <p><strong>Restaurante:</strong> ${restaurantName}</p>
            </div>
            <p>Esperamos você!</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Atenciosamente,<br>
              Equipe ${restaurantName}
            </p>
          </div>
        `,
      };
    }
    
    return { body: textBody };
  }
}

