import nodemailer from "nodemailer"

const Verify_OTP = (req, res) => {
    const { email } = req.params;
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: "damodara2006@gmail.com",
            pass: process.env.DAMO_GMAIL_PASS,
        },
    });
    let random = (Math.random() * (900000 - 100000)) + 100000;

    const otp = async (random) => {
        const info = await transporter.sendMail({
            from: '"Sakthi Auto register" <damodara2006@gmail.com>',
            to: email,
            subject: "You have registered for Sakthi-auto contest",
            // text: "You have registered for Sakthi-auto contest",
            html: `Your OTP is ${random.toFixed()}`
            ,
        });

        
    }
    otp(random)
    
    res.send(random.toFixed())
}

export { Verify_OTP }