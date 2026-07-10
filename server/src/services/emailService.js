import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// FALLBACK SMTP CONFIGURATION (If Resend is not configured)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false 
  }
});

if (!resend) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email Service Fallback Connection Failed:', error.message);
    } else {
      console.log('🚀 Email Service Connected (Nodemailer Fallback)');
    }
  });
} else {
  console.log('🚀 Email Service Connected (Resend API)');
}

/**
 * Core sendEmail function with robust error handling
 */
const sendEmail = async (to, subject, html) => {
  // DEV MODE FALLBACK
  if (!process.env.RESEND_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    const otpMatch = html.match(/>(\d{6})</);
    const otpValue = otpMatch ? otpMatch[1] : "N/A";

    console.log("\n" + "=".repeat(60));
    console.log("🚀 [DEV MODE] EMAIL INTERCEPTED");
    console.log("To:      ", to);
    console.log("Subject: ", subject);
    if (otpValue !== "N/A") {
      console.log("\n      ╔══════════════════════════════════════╗");
      console.log(`      ║      SECURITY CODE: ${otpValue}           ║`);
      console.log("      ╚══════════════════════════════════════╝\n");
    }
    console.log("=".repeat(60) + "\n");
    return { messageId: "dev-mode-fake-id" };
  }

  try {
    if (resend) {
      // RESEND API DELIVERY
      const { data, error } = await resend.emails.send({
        from: `Library Administration <onboarding@resend.dev>`, // Replace with custom domain in production
        to,
        subject,
        html
      });
      if (error) throw new Error(error.message);
      console.log(`✅ Resend Email delivered successfully: ${data.id}`);
      return data;
    } else {
      // NODEMAILER FALLBACK DELIVERY
      const mailOptions = {
        from: `"Library Infrastructure Security" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ SMTP Email delivered successfully: ${info.messageId}`);
      return info;
    }
  } catch (error) {
    console.error('❌ Production Email Delivery Failed:', error.message);
    return null;
  }
};

/**
 * Dedicated OTP delivery helper
 */
export const sendOTPEmail = async (to, userName, otp, type = "Verification") => {
  const subject = `${otp} is your ${type} code`;
  const template = type === "Verification" ? emailTemplates.verificationOTP : 
                   type === "Login" ? emailTemplates.twoFactorOTP : 
                   emailTemplates.forgotPasswordOTP;

  return await sendEmail(to, subject, template(userName, otp));
};

export const sendSMS = async (phone, message) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      console.log("\n" + "=".repeat(60));
      console.log("📱 [MOCK SMS DISPATCHED] (Twilio credentials missing in .env)");
      console.log("To Phone: ", phone);
      console.log("Message:  ", message);
      console.log("=".repeat(60) + "\n");
      return { success: true, mock: true };
    }

    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: fromPhone,
      to: phone
    });

    console.log(`✅ SMS sent successfully to ${phone}. SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("❌ Error sending SMS:", error.message);
    return { success: false, error: error.message };
  }
};

const brandColor = "#4f46e5"; // Indigo 600
const logoUrl = "https://cdn-icons-png.flaticon.com/512/3389/3389081.png"; // Premium Library Book Icon

const baseTemplate = (title, content, color = brandColor) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb; }
  .header { padding: 30px; border-bottom: 1px solid #f3f4f6; text-align: center; }
  .logo-container { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background-color: ${color}15; margin-bottom: 16px; }
  .title { color: #111827; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 40px 30px; color: #4b5563; line-height: 1.6; font-size: 16px; }
  .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { margin: 0; font-size: 13px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img src="${logoUrl}" alt="Logo" style="width: 24px; height: 24px; filter: invert(0.4) sepia(1) saturate(10) hue-rotate(220deg);" />
      </div>
      <h2 class="title">${title}</h2>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Library Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  overdueNotice: (userName, bookTitle, daysOverdue, fineAmount) => baseTemplate(
    "Overdue Notice", 
    `
    <p style="font-size: 18px; margin-bottom: 24px;">Hello <span style="color: #0f172a; font-weight: 700;">${userName}</span>,</p>
    <p>This is an automated notice regarding a book you borrowed that is currently past its return date.</p>
    
    <div style="margin: 35px 0; padding: 25px; background: linear-gradient(145deg, #fef2f2 0%, #fff1f2 100%); border-radius: 16px; border-left: 6px solid #ef4444; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
      <p style="margin: 0 0 12px 0;"><strong>Book Title:</strong> <span style="color: #991b1b;">${bookTitle}</span></p>
      <p style="margin: 0 0 12px 0;"><strong>Days Overdue:</strong> <span style="color: #991b1b; font-weight: 800;">${daysOverdue} Days</span></p>
      <p style="margin: 0; font-size: 18px;"><strong>Current Fine:</strong> <span style="color: #ef4444; font-weight: 900;">₹${fineAmount.toFixed(2)}</span></p>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">Please return the book to the circulation desk as soon as possible to prevent further accumulation of fines.</p>
    `, 
    "#ef4444" // Red
  ),

  dueTomorrowReminder: (userName, bookTitle) => baseTemplate(
    "Due Tomorrow", 
    `
    <p style="font-size: 18px; margin-bottom: 24px;">Hello <span style="color: #0f172a; font-weight: 700;">${userName}</span>,</p>
    <p>This is a friendly reminder that a book you borrowed is due <strong>tomorrow</strong>.</p>
    
    <div style="margin: 35px 0; padding: 25px; background-color: #fffbeb; border-radius: 16px; border-left: 6px solid #f59e0b;">
      <p style="margin: 0; font-size: 16px; color: #92400e;"><strong>${bookTitle}</strong></p>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">Please ensure it is returned on time to maintain your account in good standing.</p>
    `, 
    "#f59e0b" // Amber
  ),

  forgotPasswordOTP: (userName, otp) => baseTemplate(
    "Security Verification", 
    `
    <p style="font-size: 18px; margin-bottom: 24px;">Hello <span style="color: #0f172a; font-weight: 700;">${userName}</span>,</p>
    <p>We received a request to recover your account. Please use the secure authorization code below.</p>
    
    <div style="text-align: center; margin: 45px 0;">
      <div style="display: inline-block; background-color: #f8fafc; color: #4f46e5; padding: 20px 40px; border-radius: 16px; font-weight: 900; font-size: 42px; letter-spacing: 12px; border: 2px dashed #818cf8; box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);">
        ${otp}
      </div>
      <p style="margin-top: 15px; font-size: 12px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 1px;">Expires in 5 minutes</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">If you did not initiate this request, your account is safe. You can safely ignore this email.</p>
    `, 
    brandColor
  ),

  verificationOTP: (userName, otp) => baseTemplate(
    "Verify your email", 
    `
    <p style="margin-top: 0;">Hi <strong>${userName}</strong>,</p>
    <p>Welcome to the Library! Please use the verification code below to confirm your email address and activate your account.</p>
    
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
      <div style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827;">${otp}</div>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">If you didn't request this, you can safely ignore this email.</p>
    `, 
    "#2563eb" // Blue
  ),

  twoFactorOTP: (userName, otp) => baseTemplate(
    "Login Verification", 
    `
    <p style="font-size: 18px; margin-bottom: 24px;">Hello <span style="color: #0f172a; font-weight: 700;">${userName}</span>,</p>
    <p>Your account is protected by Two-Factor Authentication. Please enter this code to securely complete your sign-in.</p>
    
    <div style="text-align: center; margin: 45px 0;">
      <div style="display: inline-block; background-color: #f5f3ff; color: #8b5cf6; padding: 20px 40px; border-radius: 16px; font-weight: 900; font-size: 42px; letter-spacing: 12px; border: 2px dashed #a78bfa; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);">
        ${otp}
      </div>
    </div>
    
    <p style="color: #64748b; font-size: 14px;"><strong>Warning:</strong> If you did not attempt to log in, someone else may have your password. Please change it immediately.</p>
    `, 
    "#8b5cf6" // Violet
  ),

  finePaidReceipt: (userName, bookTitle, amount) => baseTemplate(
    "Payment Receipt", 
    `
    <p style="font-size: 18px; margin-bottom: 24px;">Hello <span style="color: #0f172a; font-weight: 700;">${userName}</span>,</p>
    <p>This is a formal confirmation that your library fine payment was successful.</p>
    
    <div style="margin: 35px 0; padding: 25px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px;">
        <span style="color: #64748b; font-weight: 600;">Transaction ID</span>
        <span style="font-family: monospace; color: #0f172a;">#TXN-${Math.floor(Math.random()*1000000)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px;">
        <span style="color: #64748b; font-weight: 600;">Book Title</span>
        <span style="color: #0f172a; font-weight: 600; text-align: right;">${bookTitle}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
        <span style="color: #0f172a; font-weight: 800; font-size: 18px;">Total Paid</span>
        <span style="color: #10b981; font-weight: 900; font-size: 24px;">₹${amount.toFixed(2)}</span>
      </div>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">Your account is fully cleared for this transaction. Thank you!</p>
    `, 
    "#10b981" // Emerald
  ),

  bookIssued: (userName, bookTitle, dueDate) => baseTemplate(
    "Book Issued", 
    `
    <p style="font-size: 18px; margin-bottom: 24px;">Hello <span style="color: #0f172a; font-weight: 700;">${userName}</span>,</p>
    <p>You have successfully borrowed a book from the library. Happy reading!</p>
    
    <div style="margin: 35px 0; padding: 25px; background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border-left: 6px solid #4f46e5;">
      <p style="margin: 0 0 12px 0;"><strong>Title:</strong> <span style="color: #0f172a;">${bookTitle}</span></p>
      <p style="margin: 0; font-size: 18px;"><strong>Due Date:</strong> <span style="color: #4f46e5; font-weight: 900;">${new Date(dueDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">Please remember to return or renew the book by the due date to avoid automated late fines.</p>
    `, 
    brandColor
  )
};

export default sendEmail;
