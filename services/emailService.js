// services/emailService.js
// Este módulo encapsula a lógica de configuração e envio de e-mails.

require('dotenv').config(); // Carrega as variáveis de ambiente

const nodemailer = require('nodemailer'); // Importa o Nodemailer

// -----------------------------------------------------------
// Configuração do Nodemailer (transporter)
// -----------------------------------------------------------
// Cria um "transporter" SMTP que será usado para enviar e-mails.
// As credenciais são carregadas das variáveis de ambiente.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Servidor SMTP (ex: 'smtp.gmail.com' para Gmail)
    port: 587,              // Porta SMTP (587 para STARTTLS)
    secure: false,          // 'false' se for 587 (STARTTLS)
    auth: {
        user: process.env.EMAIL_USER, // Seu e-mail
        pass: process.env.EMAIL_PASS  // Sua senha ou senha de aplicativo
    },
    tls: {
        rejectUnauthorized: false // APENAS PARA DESENVOLVIMENTO! Não use em produção.
    }
});

/**
 * Função assíncrona para enviar um e-mail.
 * @param {string} to O destinatário do e-mail.
 * @param {string} subject O assunto do e-mail.
 * @param {string} htmlContent O conteúdo do e-mail em HTML.
 * @returns {Promise<Object>} Um objeto com informações sobre o envio do e-mail.
 */
async function sendEmail(to, subject, htmlContent) {
    try {
        const mailOptions = {
            from: '"TiaAjuda App" <naoresponder@tiaajuda.com>', // Remetente
            to: to,
            subject: subject,
            html: htmlContent
        };
        let info = await transporter.sendMail(mailOptions);
        console.log('E-mail enviado: %s', info.messageId);
        console.log('URL de pré-visualização (se disponível): %s', nodemailer.getTestMessageUrl(info));
        return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return { success: false, error: error.message };
    }
}

// Exporta a função sendEmail para que outros módulos possam usá-la.
module.exports = {
    sendEmail
};
