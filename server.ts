import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup request body parsing
  app.use(express.json());

  // API Route: Send request material email securely
  app.post('/api/send-request-email', async (req, res) => {
    const { studentName, email, semesterName, courseName, resourceType, description, date } = req.body;

    if (!studentName || !email || !semesterName || !courseName || !description) {
      return res.status(400).json({ success: false, error: 'Missing required request parameters' });
    }

    const recipientEmail = 'ramzanareeba70@gmail.com';

    try {
      let transporter;

      // Check if user set their custom SMTP credentials in environment
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Fallback: Create dynamic Ethereal Test Account in dev
        console.log('No custom SMTP details found in .env. Creating test SMTP account...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
          },
        });
      }

      // Build text and HTML representation of the request
      const textContent = `
NEW MATERIAL REQUEST SUBMITTED

Student Name: ${studentName}
Student Email: ${email}
Target Semester: ${semesterName}
Course Name: ${courseName}
Resource Type: ${resourceType}
Date Submitted: ${date || new Date().toISOString().split('T')[0]}

Description:
${description}
      `;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #fcfcfc;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 0;">FUUAST CS Resource Hub Request</h2>
          <p style="font-size: 14px; color: #4b5563;">Assalam-o-Alaikum, a new material request has been submitted by a student.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold; width: 35%; font-size: 13px; color: #374151;">Student Name</td>
              <td style="padding: 10px; font-size: 13px; color: #1f2937;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; font-size: 13px; color: #374151;">Student Email</td>
              <td style="padding: 10px; font-size: 13px; color: #1f2937;">${email}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold; font-size: 13px; color: #374151;">Semester</td>
              <td style="padding: 10px; font-size: 13px; color: #1f2937;">${semesterName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; font-size: 13px; color: #374151;">Course / Subject</td>
              <td style="padding: 10px; font-size: 13px; color: #1f2937;">${courseName}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold; font-size: 13px; color: #374151;">Resource Category</td>
              <td style="padding: 10px; font-size: 13px; color: #1f2937; text-transform: capitalize;">${resourceType.replace('_', ' ')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; font-size: 13px; color: #374151;">Submitted Date</td>
              <td style="padding: 10px; font-size: 13px; color: #1f2937;">${date || new Date().toISOString().split('T')[0]}</td>
            </tr>
          </table>

          <div style="background-color: #eef2ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h4 style="margin: 0 0 5px 0; color: #3730a3; font-size: 13px;">Student Description & Details:</h4>
            <p style="margin: 0; font-size: 13px; color: #312e81; white-space: pre-wrap; line-height: 1.5;">${description}</p>
          </div>

          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This email was securely relayed by CS Resource Center backend.
          </p>
        </div>
      `;

      const mailOptions = {
        from: '"FUUAST CS Resource Center" <no-reply@fuuast-cs-hub.edu>',
        to: recipientEmail,
        subject: `[FUUAST CS Request] New Material Needed: ${courseName} (${semesterName})`,
        text: textContent,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log('Message sent securely! ID:', info.messageId);
      
      // If we used ethereal fallback, log the preview URL
      let previewUrl = '';
      if (!process.env.SMTP_USER) {
        previewUrl = nodemailer.getTestMessageUrl(info) || '';
        console.log('Ethereal Mail Preview URL Available:', previewUrl);
      }

      return res.status(200).json({
        success: true,
        messageId: info.messageId,
        previewUrl,
      });

    } catch (mailError) {
      console.error('Email sending failed in backend:', mailError);
      return res.status(500).json({ success: false, error: mailError instanceof Error ? mailError.message : String(mailError) });
    }
  });

  // Serve Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend resources in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started, listening on ports: ${PORT}`);
  });
}

startServer();
