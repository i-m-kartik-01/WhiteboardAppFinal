const express = require('express')
const {
    registerUser,
    loginUser,
    getAllUsers,
    getProfile,
    refreshAccessToken,
} = require("../controllers/userController");

const multer = require("multer");
const upload = multer();   
const authMiddleware = require('../middleware/auth');
       
const router = express.Router();

router.post('/register', upload.none(), registerUser);
router.post('/login', upload.none(), loginUser);
router.post('/refreshToken', upload.none(), refreshAccessToken);
router.get('/allUsers',authMiddleware, getAllUsers);
router.get('/profile', authMiddleware, getProfile);


module.exports = router
