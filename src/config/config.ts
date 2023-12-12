import * as nodemailer from 'nodemailer';
import 'dotenv/config';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  }
});

export const getMailOptions = (to:string, subject:string, text:string) => ({
  to,
  subject,
  text,
});
