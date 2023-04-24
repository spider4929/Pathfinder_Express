const mongoose = require('mongoose')

const Schema = mongoose.Schema 

const preferenceSchema = new Schema({
    preferences: {
        type: [{
            name: { type: String, required: true },
            display: { type: String, required: true },
            value: { type: Number, required: true, default: 5 },
            enabled: { type: Boolean, required: true, default: true }
        }],
        default: [
            { name: 'not_flood_hazard', display: 'Avoid Flood-prone Areas', value: 5, enabled: true },
            { name: 'pwd_friendly', display: 'PWD-friendly', value: 5, enabled: true },
            { name: 'cctv', display: 'CCTV-presence', value: 5, enabled: true },
            { name: 'landmark', display: 'Landmarks', value: 5, enabled: true },
            { name: 'lighting', display: 'Well-lit Areas', value: 5, enabled: true },
            { name: 'not_major_road', display: 'Avoid Major Roads', value: 5, enabled: true }
        ]
    },
    user_id: {
        type: String,
        required: true
    }
});


module.exports = mongoose.model('Preference', preferenceSchema)