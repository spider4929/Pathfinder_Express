const express = require('express')
const {
    getPreference,
    createPreference,
    updatePreference
} = require('../controllers/preferenceController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// require auth for all preference routes
router.use(requireAuth)

// GET a single preference
router.get('/', getPreference)

// POST a new preference
router.post('/', createPreference)

// UPDATE a preference
router.patch('/:id', updatePreference)

module.exports = router