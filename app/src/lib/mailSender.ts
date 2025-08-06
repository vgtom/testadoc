// const nodemailer = require('nodemailer');
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 1025,
  secure: false,
});

export const sendMail = async ({
  from,
  to,
  subject,
  text,
}: {
  from: string;
  to: string;
  subject: string;
  text: string;
}) => {
  transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
};
