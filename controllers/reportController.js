const Report = require('../models/reportModel')
const mongoose = require('mongoose')

const toRadians = (degrees) => {
      return degrees * Math.PI / 180
    }

const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3
    const phi1 = toRadians(lat1)
    const phi2 = toRadians(lat2)
    const deltaPhi = toRadians(lat2 - lat1)
    const deltaLambda = toRadians(lon2 - lon1)

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

const thresholdDistance = 50

// display report
const getReport = async (req, res) => {
    const { coordsData } = req.body;
    const response = []
    const reports = await Report.find()

    for (const coordinate of coordsData) {
        for (const a of reports) {
            const aCoords = a.coordinates 
            const distance = haversineDistance(coordinate.latitude, coordinate.longitude, aCoords.latitude, aCoords.longitude)
            if (distance <= thresholdDistance) {
                const { _id, source, coordinates, category, expiry } = a
                const objToAdd = { _id, source, coordinates, category, expiry };
                if (!response.some((obj) => obj._id === objToAdd._id)) {
                    response.push(objToAdd);
                }
            }
        }
    }

    res.status(200).json(response)
}

// create new report
const createReport = async (req, res) => {
    const { source, coordinates, category, description } = req.body;
    console.log(coordinates)
    if (!req.file) {
        return res.status(400).json({ error: "No image file was uploaded" })
    }

    if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Uploaded file is not a valid image" })
    }

    if (req.file.size > 20 * 1024 * 1024) {
        return res.status(400).json({ error: "Uploaded file exceeds the maximum size of 20 MB" });
    }

    const image = req.file.buffer

    try {
        let found = false
        const user_id = req.user._id;
        const parsedCoordinates = JSON.parse(coordinates);
        const reports = await Report.find({ category: category })
        for (const a of reports) {
            const aCoords = a.coordinates
            const distance = haversineDistance(parsedCoordinates.latitude, parsedCoordinates.longitude, aCoords.latitude, aCoords.longitude)
            if (distance <= thresholdDistance) {
                if (a.user_id !== user_id) {
                    found = true
                    const expiry = a.expiry 
                    await Report.findOneAndUpdate({_id: a.id}, { expiry: expiry.getTime() + (15 * 60 * 1000) })
                }   
            }
        }
        if (found) {
            const tempReport = { source, coordinates: parsedCoordinates, category, description, image, user_id };
            return res.status(200).json(tempReport)
        }
        const report = await Report.create({ source, coordinates: parsedCoordinates, category, description, image, user_id });
        
        return res.status(200).json(report);
    } catch (error) {
       return res.status(400).json({ error: error.message });
    }
};

// Add Expiry
const addExpiry = async (req, res) => {
    const { id } = req.params 

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such report'})
    }

    const report = await Report.findById(id)

    if (!report) {
        return res.status(404).json({error: 'No such report'})
    }

    // add 15 minutes to the expiry time
    const newExpiry = new Date(report.expiry.getTime() + 15 * 60000)

    report.expiry = newExpiry

    const updatedReport = await report.save()

    res.status(200).json(updatedReport)
}

const subtractExpiry = async (req, res) => {
    const { id } = req.params 

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such report'})
    }

    const report = await Report.findById(id)

    if (!report) {
        return res.status(404).json({error: 'No such report'})
    }

    // subtract 15 minutes from the expiry time
    const newExpiry = new Date(report.expiry.getTime() - 15 * 60000)

    report.expiry = newExpiry

    // check if the new expiry time is past the current time
    if (newExpiry.getTime() < Date.now()) {
        await Report.findByIdAndDelete(id)
        return res.status(200).json({message: 'Report deleted'})
    }

    const updatedReport = await report.save()

    res.status(200).json(updatedReport)
}




module.exports = { getReport, createReport, updateReportExpiry, addExpiry, subtractExpiry }