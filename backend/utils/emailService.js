const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEventRegistrationEmail = async (studentEmail, studentName, eventTitle, qrToken) => {
  try {
    // Generate QR code as a Data URI
    const qrDataURI = await QRCode.toDataURL(qrToken);
    
    // Convert Data URI to buffer for email attachment
    const base64Data = qrDataURI.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, 'base64');

    const mailOptions = {
      from: `"Campus Connect" <${process.env.SMTP_USER}>`,
      to: studentEmail,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${studentName},</h2>
          <p>You have successfully registered for <strong>${eventTitle}</strong>!</p>
          <p>Please find your unique entry QR Code attached below. You must present this QR code at the venue to mark your attendance.</p>
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ccc; border-radius: 8px; padding: 10px;" />
          </div>
          <p>See you there!</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>Campus Connect Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBuffer,
          cid: 'qrcode' // same cid value as in the html img src
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Registration email sent to ${studentEmail}: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${studentEmail}:`, error);
  }
};

module.exports = {
  sendEventRegistrationEmail,
  sendPasswordResetEmail: async (email, otp) => {
    try {
      const mailOptions = {
        from: `"Campus Connect" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Password Reset OTP`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            <h2>Password Reset</h2>
            <p>You have requested to reset your password. Use the following OTP to complete the process:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #4F46E5;">${otp}</h1>
            <p>This OTP is valid for 15 minutes.</p>
            <br/>
            <p>If you did not request this, please ignore this email.</p>
            <p>Best Regards,</p>
            <p><strong>Campus Connect Team</strong></p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending reset OTP email:', error);
      throw error;
    }
  }
};
