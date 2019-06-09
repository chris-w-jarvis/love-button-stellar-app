// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
require('dotenv').config()
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

let host = 'http://localhost:8080/reset/'

module.exports = {
    sendAccountRecoveryEmail: function(pwResetToken, userEmail, username) {
        const text = `If you did not request a password reset please delete this email. Click this link to reset password for ${username}: ${host}${pwResetToken}`
        const msg = {
            to: userEmail,
            from: 'noreply@love-button.org',
            subject: 'RESET YOUR love-button PASSWORD',
            text: text
          };
          try {
            sgMail.send(msg);
          } catch (err) {
              console.log('Error sending account recovery email: '+err)
          }
    }
}