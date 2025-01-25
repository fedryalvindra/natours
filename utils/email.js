const nodemailer = require('nodemailer');
const Transport = require('nodemailer-brevo-transport');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome()
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Fedry Alvindra <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // BREVO
      return nodemailer.createTransport({
        service: 'Brevo',
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: '843db5001@smtp-brevo.com', // generated ethereal user
          pass: 'xsmtpsib-be673a5c00584b3abf2518b25af9a6689e1900e9f05bf3d4dd4222799a319176-ADcV0s71a9FEQ4M8', // generated ethereal password
        },
      });
    }
    // 1). Create a transporter
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      logger: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // In your gmail you need to activate less secure app option
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML for email based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html, { wordwrap: false }),
      // html:
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
};

// const sendEmail = async (options) => {
//   // 3). Actually send the email
//   await transporter.sendMail(mailOptions);
// };
