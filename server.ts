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

  // API Route: Send OTP email securely to student's email
  app.post('/api/send-otp', async (req, res) => {
    const { email, otpCode, name } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, error: 'Missing target email address or OTP code' });
    }

    try {
      let transporter;

      // Check if user set their custom SMTP credentials in environment
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Fallback: Create dynamic Ethereal Test Account in dev
        console.log('No custom SMTP details found in .env. Creating test SMTP account for OTP...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
          },
        });
      }

      const textContent = `
Your FUUAST CS Resource Hub Signup OTP code is: ${otpCode}

Assalam-o-Alaikum ${name || 'Student'},
Your 6-digit verification code is: ${otpCode}

Please enter this verification code on the registration page to verify your email and complete signup.
      `;

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; text-align: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="display: inline-block; padding: 14px; background-color: #4f46e5; border-radius: 50%; margin-bottom: 20px;">
            <span style="font-size: 24px; color: #ffffff;">🔑</span>
          </div>
          <h2 style="color: #4f46e5; margin: 0 0 12px 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Verify Your Email</h2>
          <p style="font-size: 15px; color: #475569; margin-top: 0; font-weight: 600;">Assalam-o-Alaikum ${name || 'Student'},</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 25px; padding: 0 10px;">
            Thank you for registering your student profile at <strong>FUUAST CS Resource Hub</strong>. Use the following security One-Time Password (OTP) to complete your verification:
          </p>
          
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 12px; margin: 25px 0; display: inline-block; width: 100%; box-sizing: border-box;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e293b; font-family: 'Courier New', Courier, monospace; display: block; text-align: center; margin-left: 8px;">${otpCode}</span>
          </div>

          <p style="font-size: 12px; color: #ef4444; margin: 15px 0 0 0; font-weight: 600;">
            This OTP code is valid for 15 minutes. Please do not share it with anyone.
          </p>

          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px; line-height: 1.5;">
            If you did not initiate this registration request, you can safely ignore this email.<br/>
            This email was securely sent from FUUAST CS Resource Hub backend.
          </p>
        </div>
      `;

      const mailOptions = {
        from: '"FUUAST CS Resource Hub" <no-reply@fuuast-cs-hub.edu>',
        to: email,
        subject: `[FUUAST CS] ${otpCode} is your verification code`,
        text: textContent,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('OTP Email successfully sent to:', email, 'MessageID:', info.messageId);
      
      let previewUrl = '';
      if (!process.env.SMTP_USER) {
        previewUrl = nodemailer.getTestMessageUrl(info) || '';
        console.log('OTP Ethereal Mail Preview URL of developer test:', previewUrl);
      }

      return res.status(200).json({
        success: true,
        messageId: info.messageId,
        previewUrl,
      });

    } catch (err: any) {
      console.error('OTP email backend dispatch failed:', err);
      return res.status(500).json({ success: false, error: err?.message || String(err) });
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
