# 📱 Configuração de Notificações - RestoFlow

Este documento explica como configurar as integrações reais de notificações (SMS, WhatsApp e Email) no RestoFlow.

## 🔧 Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env` do backend:

### Modo Mock (Desenvolvimento)
```env
# Força uso de mocks mesmo com credenciais configuradas
NOTIFICATIONS_MOCK=true
```

### Twilio (SMS e WhatsApp)
```env
# Credenciais Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Número Twilio para SMS (formato: +5511999999999)
TWILIO_PHONE_NUMBER=+5511999999999

# Número Twilio para WhatsApp (formato: whatsapp:+14155238886)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Email (SMTP)
```env
# Configurações SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
SMTP_FROM=RestoFlow <seu-email@gmail.com>
```

## 📋 Como Obter Credenciais

### Twilio

1. Acesse [https://www.twilio.com](https://www.twilio.com)
2. Crie uma conta (trial gratuito disponível)
3. No Dashboard, encontre:
   - **Account SID**: No topo da página
   - **Auth Token**: Clique em "View" para revelar
4. Para SMS:
   - Vá em "Phone Numbers" > "Buy a number"
   - Escolha um número (gratuito no trial)
   - Use este número em `TWILIO_PHONE_NUMBER`
5. Para WhatsApp:
   - Vá em "Messaging" > "Try it out" > "Send a WhatsApp message"
   - Use o número sandbox: `whatsapp:+14155238886`
   - Ou configure WhatsApp Business API

### Email (Gmail como exemplo)

1. **Gmail com App Password:**
   - Ative 2FA na sua conta Google
   - Vá em [App Passwords](https://myaccount.google.com/apppasswords)
   - Gere uma senha de app
   - Use:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=seu-email@gmail.com
     SMTP_PASSWORD=senha-de-app-gerada
     ```

2. **Outros provedores SMTP:**
   - **SendGrid**: Use API Key
   - **Mailgun**: Use API Key
   - **Amazon SES**: Use credenciais AWS
   - **Outlook**: `smtp-mail.outlook.com:587`

## 🧪 Testando as Notificações

### Modo Mock (Padrão)
Por padrão, o sistema usa mocks. As notificações são apenas logadas no console:

```
📱 [MOCK SMS] Para: +5511999999999
   Mensagem: Olá João, sua mesa no Restaurante Demo está pronta!
```

### Modo Real
1. Configure as variáveis de ambiente acima
2. **NÃO** defina `NOTIFICATIONS_MOCK=true`
3. Reinicie o backend
4. As notificações serão enviadas de verdade

## 📝 Templates Customizáveis

Os templates de notificação podem ser customizados editando:
`backend/src/notifications/notification-templates.service.ts`

Templates disponíveis:
- `getQueueAlertTemplate()` - Alerta quando mesa está pronta
- `getQueuePositionTemplate()` - Notificação de posição na fila
- `getReservationConfirmationTemplate()` - Confirmação de reserva
- `getReservationReminderTemplate()` - Lembrete de reserva

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite o arquivo `.env` no Git
- Use variáveis de ambiente em produção
- Para produção, considere usar serviços gerenciados (AWS SES, SendGrid, etc.)

## 📊 Logs

O sistema registra todas as tentativas de envio:
- ✅ Sucesso: `✅ SMS enviado com sucesso para +5511999999999. SID: SMxxxxx`
- ❌ Erro: `❌ Erro ao enviar SMS para +5511999999999: [detalhes]`

## 🐛 Troubleshooting

### Twilio retorna erro 21211
- Verifique se o número está no formato correto: `+5511999999999`
- No trial, só pode enviar para números verificados

### Email não envia
- Verifique se `SMTP_SECURE` está correto (true para 465, false para 587)
- Para Gmail, use senha de app, não a senha normal
- Verifique firewall/antivírus bloqueando conexões SMTP

### WhatsApp não funciona
- No trial, só funciona com números sandbox do Twilio
- Para produção, precisa configurar WhatsApp Business API

