const Preference = require('../models/preferenceModel')
const mongoose = require('mongoose')

// get a single preference
const getPreference = async (req, res) => {
    const user_id = req.user._id

    const preference = await Preference.find({user_id})

    res.status(200).json(preference[0])
}

// create new preference
const createPreference = async (req, res) => {
    const {preferences} = req.body

    // add doc to db
    try {
        const user_id = req.user._id
        const preference = await Preference.create({preferences, user_id})
        res.status(200).json(preference)
    } catch(error) {
        res.status(400).json({error: error.message})
    }
}

// update a preference
const updatePreference = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such preference'})
    }

    const preference = await Preference.findOneAndUpdate({_id: id}, {
        ...req.body
    }, {new: true})

    if (!preference) {
        return res.status(404).json({error: 'No such preference'})
    }

    res.status(200).json(preference)
}


module.exports = {
    getPreference,
    createPreference,
    updatePreference,
}