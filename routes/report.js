const express = require('express')
const { createReport } = require('../controllers/reportController')
const requireAuth = require('../middleware/requireAuth')

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router()

// require auth for the report route
router.use(requireAuth)

// POST a new report
router.post('/', upload.single('image'), createReport)

module.exports = router