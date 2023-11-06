import {createUser, login, getAccountDetail, saveScore, savePosition, changePassword, sendOTP, resetPassword, getLeaderBoard} from "../Controllers/userController.js";
import express from 'express';

const router = express.Router();
router.post('/signup', createUser);
router.post('/login', login);
router.get('/details', getAccountDetail);
router.post('/saveScore', saveScore);
router.post('/savePosition', savePosition);
router.post('/changePassword', changePassword);
router.post('/sendOTP', sendOTP);
router.post('/resetPassword', resetPassword);
router.get('/getLeaderBoard', getLeaderBoard);

export default router;