// const nodemailer = require('nodemailer');
import nodemailer from "nodemailer";
import { env } from "wasp/server";
import { emailSender } from "wasp/server/email";

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
  if (env.NODE_ENV === "development")
    transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
  else
    emailSender.send({
      from: { email: "info@getjurito.com" },
      html: text,
      subject,
      text,
      to,
    });
};
