import mongoose from "mongoose";

var userSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    score: {
        type: Number,
        default: 0
    },
    positionX: {
        type: String,
        default: "",
        trim: true
    },
    positionY: {
        type: String,
        default: "",
        trim: true
    },
    positionZ: {
        type: String,
        default: "",
        trim: true
    },
    otp: {
        type: Number,
        default: null,
        trim: true
    },
    otpExpiration: {
        type: Date,
        default: null,
        trim: true
    }

});

export default mongoose.model('User', userSchema);