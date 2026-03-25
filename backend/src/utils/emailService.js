const nodemailer = require('nodemailer');

const isPlaceholder = (value = '') =>
  ['your_email@gmail.com', 'your_app_password'].includes(value.trim().toLowerCase());

const isEmailConfigured = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return false;
  }

  if (isPlaceholder(user) || isPlaceholder(pass)) {
    return false;
  }

  return true;
};

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

const sendOrderConfirmationEmail = async ({ to, name, order }) => {
  if (!isEmailConfigured()) {
    console.warn(
      'Email not sent: SMTP is not configured correctly. Set SMTP_USER and SMTP_PASS to real values in backend/.env'
    );
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const customerName = name || 'Customer';
  const itemsText = (order.items || [])
    .map((item) => `- ${item.name} x${item.quantity} = Rs ${item.price * item.quantity}`)
    .join('\n');

  const subject = `Order Confirmation - ${order.orderId}`;
  const text = `Hi ${customerName},

Thank you for your order.

Order ID: ${order.orderId}
Payment Method: ${order.paymentMethod}
Order Total: Rs ${order.total}

Items:
${itemsText}

We will notify you about shipping updates soon.

Regards,
The Cotton Butterflies`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Order Confirmation</h2>
      <p>Hi ${customerName},</p>
      <p>Thank you for your order.</p>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Order Total:</strong> Rs ${order.total}</p>
      <h4>Items</h4>
      <ul>
        ${(order.items || [])
          .map(
            (item) =>
              `<li>${item.name} x${item.quantity} = Rs ${item.price * item.quantity}</li>`
          )
          .join('')}
      </ul>
      <p>We will notify you about shipping updates soon.</p>
      <p>Regards,<br/>The Cotton Butterflies</p>
    </div>
  `;

  console.log(`Attempting to send order confirmation email to: ${to}`);

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  console.log(`Order confirmation email sent successfully to: ${to}`);
  return { sent: true };
};

const sendSupportMessageEmail = async ({ name, email, subject, message, createdAt }) => {
  const helplineEmail =
    process.env.SUPPORT_EMAIL || 'thecottonbutterflieshelpline@gmail.com';

  if (!isEmailConfigured()) {
    console.warn(
      'Support email not sent: SMTP is not configured correctly. Set SMTP_USER and SMTP_PASS to real values in backend/.env'
    );
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const submittedAt = createdAt ? new Date(createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const text = `New support request received

Name: ${name}
Email: ${email}
Subject: ${subject}
Submitted: ${submittedAt}

Message:
${message}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>New Support Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Submitted:</strong> ${submittedAt}</p>
      <h4>Message</h4>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: helplineEmail,
    replyTo: email,
    subject: `Support: ${subject}`,
    text,
    html
  });

  return { sent: true };
};

module.exports = {
  sendOrderConfirmationEmail,
  sendSupportMessageEmail
};
