const express = require('express');
const {getAllCanvas, createCanvas, loadCanvas, updateCanvas, shareCanvas, deleteSharedUser} = require('../controllers/canvasController');
const authMiddleware = require('../middleware/auth');


const multer = require("multer");
const upload = multer(); 

const router = express.Router();

router.get('', authMiddleware, getAllCanvas);
router.post('/createCanvas', authMiddleware, createCanvas);
router.get('/openCanvas/:canvasId',authMiddleware,loadCanvas);
router.put('/updateCanvas', authMiddleware, updateCanvas)
router.put('/shareCanvas', authMiddleware, shareCanvas);
router.delete('/deleteSharedUser', authMiddleware, deleteSharedUser);

module.exports = router
