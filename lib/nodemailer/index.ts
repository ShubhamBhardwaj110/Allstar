import nodemailer from 'nodemailer';
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from './templates';

interface WelcomeEmailData {
    email: string;
    name: string;
    intro: string;
}

interface NewsEmailData {
    email: string;
    name: string;
    newsContent: string;
    articleCount: number;
}

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});

export const sendWelcomeEmail = async({email,name,intro}:WelcomeEmailData)=>{
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}',name)
        .replace('{{intro}}',intro);
    const mailOptions = {
        from: `"Allstar"<allstar@example.com>`,
        to: email,
        subject: 'Welcome to Allstar!',
        text: `Hi ${name},\n\n${intro}\n\nBest regards,\nThe Allstar Team`,
        html: htmlTemplate,
    };
    await transporter.sendMail(mailOptions);
}

export const sendNewsEmailToUser = async({ email, name, newsContent, articleCount }: NewsEmailData) => {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', dateString)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Allstar"<allstar@example.com>`,
        to: email,
        subject: `Daily Market News Summary - ${dateString}`,
        text: `Hi ${name},\n\nHere's your daily market news summary with ${articleCount} articles.\n\nBest regards,\nThe Allstar Team`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
}