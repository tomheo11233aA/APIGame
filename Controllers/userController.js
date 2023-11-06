import User from "../Model/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import {google} from "googleapis";
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});


export const createUser = async (req, res) => {
    const { userName, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ userName: userName });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
    if (existingUser) {
        return res.status(422).json({ message: "User already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password);
    const createdUser = new User({
        userName,
        password: hashedPassword,
    });
    try {
        await createdUser.save();
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
    res.status(201).json({ user: createdUser, status: 1, notification: "Đăng ký thành công" });
}

export const login = async (req, res) => {
    const { userName, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ userName: userName });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
    if (!existingUser) {
        return res.status(404).json({ message: "Couldn't Find User By This userName" });
    }

    const isPasswordCorrected = bcrypt.compareSync(password, existingUser.password);

    if (!isPasswordCorrected) {
        return res.status(400).json({ message: "Your password is incorrect",  status: 0 })
    }
    return res.status(200).json({
        status: 1,
        notification: "Đăng nhập thành công",
        username: existingUser.userName,
        score: existingUser.score,
        positionX: existingUser.positionX,
        positionY: existingUser.positionY,
        positionZ: existingUser.positionZ
    })
}

export const getAccountDetail = async (req, res) => {
    const { id } = req.query;

    let userDetails;
    try {
        userDetails = await User.findOne({ userName: id });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

    if (!userDetails) {
        return res.status(404).json({ message: "User not found" });
    }
    const responseObj = {
        username: userDetails.userName,
        password: userDetails.password,
        score: userDetails.score,
        positionX: userDetails.positionX,
        positionY: userDetails.positionY,
        positionZ: userDetails.positionZ,
        otp: userDetails.otp
    };
    return res.status(200).json(responseObj);
};

export const saveScore = async (req, res) => {
    const {userName, score} = req.body;

    try {
        const user = await User.findOne({userName: userName});

        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        user.score = score;
        await user.save();
        return res.status(200).json({message: "Save score successfully"});
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
};

export const savePosition = async (req, res) => {
    const {username, positionX, positionY, positionZ} = req.body;

    try {
        const user = await User.findOne({userName: username});
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        user.positionX = positionX;
        user.positionY = positionY;
        user.positionZ = positionZ;
        await user.save();

        return res.status(200).json({message: "Save position successfully"});
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
};

export const changePassword = async (req, res) => {
    const { username, oldpassword, newpassword } = req.body;

    try {
        const user = await User.findOne({ userName: username });
        console.log(req.body);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordCorrect = bcrypt.compareSync(oldpassword, user.password);
        if (!passwordCorrect) {
            return res.status(400).json({ message: "Your password is incorrect" });
        }

        const hashedPassword = bcrypt.hashSync(newpassword);
        
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({ notification: "Đổi mật khẩu thành công", status: 1 });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const generateOTP = () => {
    const otpLength = 4;
    const characters = '0123456789';
    let otp = '';
    for (let i = 0; i < otpLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters[randomIndex];
    }
    const otpExpiration = new Date(Date.now() + 5 * 60  * 1000); 
    return { otp, otpExpiration };
};

const sendOTPByEmail = async (email, subject, text, otp) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                type: 'OAuth2',
                user: 'phucnamvan0712@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });
        const mailOptions = {
            from: 'phucnamvan0712@gmail.com',
            to: email,
            subject: subject,
            text: text,
            html: `<p>${otp}:</p>`,
        };
        await transporter.sendMail(mailOptions);

        return otp;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const sendOTP = async (req, res) => {
    const { username } = req.body;

    try {
        const user = await User.findOne({ userName: username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { otp, otpExpiration } = generateOTP();
        user.otp = otp;
        user.otpExpiration = otpExpiration;
        await user.save();
        await sendOTPByEmail(username, "OTP:" , " Đừng chia sẻ mã này với bất kỳ ai", "Mã OTP của quý khách là: " + otp + " - Đừng chia sẻ mã này với bất kỳ ai", otp);
        return res.status(200).json({ notification: "Gửi OTP thành công", status: 1 });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const resetPassword = async (req, res) => {
    const { username, otp, newpassword } = req.body;

    try {
        const user = await User.findOne({ userName: username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const otpCorrect = otp === user.otp;
        const otpNotExpired = user.otpExpiration > new Date(); 
        if (!otpCorrect || !otpNotExpired) {
            return res.status(400).json({ message: "Your OTP is incorrect or has expired" });
        }

        const hashedPassword = bcrypt.hashSync(newpassword);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({ notification: "Đổi mật khẩu thành công", status: 1 });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getLeaderBoard = async (req, res) => {
    try {
        const users = await User.find({}, 'userName score').sort({ score: -1 }).limit(10);
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}