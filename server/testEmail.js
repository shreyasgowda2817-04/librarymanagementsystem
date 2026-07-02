import nodemailer from "nodemailer";

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'shreyasgowda2817@gmail.com',
      pass: 'fopnzvtatyzsvoxe'
    }
  });

  try {
    console.log("Verifying connection to Gmail...");
    await transporter.verify();
    console.log("SUCCESS! Credentials are valid and connection is established.");
    
    // Attempt to send a test email to themselves
    const info = await transporter.sendMail({
      from: '"Test Library" <shreyasgowda2817@gmail.com>',
      to: 'shreyasgowda2817@gmail.com',
      subject: 'Test Email from Library System',
      text: 'This is a test email to verify credentials.'
    });
    console.log("Test email sent! Message ID:", info.messageId);
    
  } catch (error) {
    console.error("FAILED to connect or send email:");
    console.error(error.message);
  }
}

testEmail();
