import nodemailer from 'nodemailer';

interface SendMailParams {
  to: string;
  fullName: string;
  password: string;
}

export const sendMail = async ({ to, fullName, password }: SendMailParams): Promise<void> => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `TechVN <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Chào mừng bạn gia nhập công ty - Thông tin đăng nhập',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Xin chào ${fullName},</h2>
                    <p>Chào mừng bạn gia nhập đội ngũ của chúng tôi!</p>
                    <p>Dưới đây là thông tin đăng nhập hệ thống:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Email:</strong> ${to}</p>
                        <p><strong>Mật khẩu:</strong> <span style="color: #e74c3c; font-weight: bold;">${password}</span></p>
                    </div>
                    <p style="color: #e74c3c; font-weight: bold;">⚠️ Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu!</p>
                    <p>Trân trọng,</p>
                    <p><strong>Đội ngũ TechVN</strong></p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
   