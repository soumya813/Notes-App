const nodemailer = require('nodemailer');
const { getConfig } = require('../config/config');

let transporter = null;
function getTransporter() {
  const cfg = getConfig().MAIL;
  if (!cfg.host || !cfg.user || !cfg.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port || 587,
      secure: (cfg.port || 587) === 465,
      auth: { user: cfg.user, pass: cfg.pass }
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    return { sent: false, reason: 'Email not configured' };
  }
  const from = getConfig().MAIL.from;
  await t.sendMail({ from, to, subject, html, text });
  return { sent: true };
}

module.exports = { sendMail };
