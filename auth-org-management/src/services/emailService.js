const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
            user: config.email.user,
            pass: config.email.pass
        }
    });
};

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Auth App" <${config.email.from}>`,
            to,
            subject,
            html,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'email_verification') => {
    const subjects = {
        email_verification: 'Verify Your Email Address',
        password_reset: 'Reset Your Password'
    };

    const messages = {
        email_verification: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; text-align: center;">Email Verification</h2>
                <p style="color: #666; font-size: 16px;">Thank you for registering! Please use the following OTP to verify your email address:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #4CAF50; letter-spacing: 8px; margin: 0;">${otp}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">This OTP will expire in ${config.otp.expiryMinutes} minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        `,
        password_reset: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; text-align: center;">Password Reset</h2>
                <p style="color: #666; font-size: 16px;">You requested to reset your password. Use the following OTP:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #FF5722; letter-spacing: 8px; margin: 0;">${otp}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">This OTP will expire in ${config.otp.expiryMinutes} minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
        `
    };

    return sendEmail({
        to: email,
        subject: subjects[purpose] || 'Your OTP Code',
        html: messages[purpose] || messages.email_verification,
        text: `Your OTP is: ${otp}. This code will expire in ${config.otp.expiryMinutes} minutes.`
    });
};

// Send welcome email
const sendWelcomeEmail = async (email, fullName) => {
    return sendEmail({
        to: email,
        subject: 'Welcome to Our Platform!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; text-align: center;">Welcome, ${fullName}!</h2>
                <p style="color: #666; font-size: 16px;">Thank you for joining us. Your email has been verified successfully.</p>
                <p style="color: #666; font-size: 16px;">You can now access all features of our platform.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${config.frontendUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Get Started</a>
                </div>
            </div>
        `,
        text: `Welcome, ${fullName}! Your email has been verified successfully.`
    });
};

module.exports = {
    sendEmail,
    sendOTPEmail,
    sendWelcomeEmail
};
