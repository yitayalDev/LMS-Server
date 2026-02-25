import nodemailer from 'nodemailer';

// Create a transporter using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'LMS Platform'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

/**
 * Sends a welcome/login notification email
 */
export const sendLoginNotificationEmail = async (email: string, name: string) => {
    const subject = 'New Login to Your Account';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${name},</h2>
            <p>We noticed a new login to your account on the platform.</p>
            <p>If this was you, you can safely ignore this email.</p>
            <p>If you did not log in, please secure your account immediately by resetting your password.</p>
            <br />
            <p>Best regards,<br/>The LMS Team</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

/**
 * Sends a notification when a user successfully purchases a course
 */
export const sendPaymentSuccessEmail = async (email: string, name: string, courseTitle: string, amount: number) => {
    const subject = 'Payment Successful - Course Enrollment Confirmed';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank You for Your Purchase, ${name}!</h2>
            <p>Your payment of $${amount.toFixed(2)} was successful.</p>
            <p>You have been successfully enrolled in: <strong>${courseTitle}</strong></p>
            <p>You can now access your course materials from your dashboard.</p>
            <br />
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
            <br /><br />
            <p>Best regards,<br/>The LMS Team</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

/**
 * Sends a notification when an instructor creates/uploads a new course
 */
export const sendCourseCreatedEmail = async (email: string, name: string, courseTitle: string) => {
    const subject = 'Course Successfully Created';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Congratulations ${name}!</h2>
            <p>Your new course "<strong>${courseTitle}</strong>" has been successfully created and uploaded.</p>
            <p>It is now available for students to enroll and start learning. You can manage your course from your instructor dashboard.</p>
            <br />
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/instructor/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Go to Instructor Dashboard</a>
            <br /><br />
            <p>Best regards,<br/>The LMS Team</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

/**
 * Sends a notification with exam results
 */
export const sendExamResultEmail = async (email: string, name: string, examTitle: string, score: number, status: 'passed' | 'failed') => {
    const isPassed = status === 'passed';
    const subject = `Exam Results: ${examTitle} - ${isPassed ? 'Passed!' : 'Failed'}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${name},</h2>
            <p>Here are your results for the comprehensive exam: <strong>${examTitle}</strong></p>
            <div style="padding: 15px; margin: 20px 0; border-radius: 5px; background-color: ${isPassed ? '#D1FAE5' : '#FEE2E2'}; border: 1px solid ${isPassed ? '#34D399' : '#F87171'};">
                <h3 style="margin-top: 0; color: ${isPassed ? '#065F46' : '#991B1B'};">Status: ${status.toUpperCase()}</h3>
                <p style="font-size: 18px; margin-bottom: 0;">Score: <strong>${score}%</strong></p>
            </div>
            ${isPassed ? '<p>Congratulations on passing the exam! You can download your certificate from your dashboard.</p>' : '<p>Unfortunately, you did not pass this time. We encourage you to review the course materials and try again.</p>'}
            <br />
            <p>Best regards,<br/>The LMS Team</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};
