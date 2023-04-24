const express = require('express')
const { createReport } = require('../controllers/reportController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// require auth for the report route
router.use(requireAuth)

// POST a new report
router.post('/', createReport)

module.exports = router