import nodemail from "nodemailer";

class MailService {
  constructor() {
    this.transporter = nodemail.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(to, subject, text) {
    const options = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };
    await this.transporter.sendMail(options);
  }
}

export default MailService;
