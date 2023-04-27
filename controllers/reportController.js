const Report = require('../models/reportModel')

// create new report
const createReport = async (req, res) => {
    const { source, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: "No image file was uploaded" })
    }

    if (!req.file.mimetype.startswith("image/")) {
        return res.status(400).json({ error: "Uploaded file is not a valid image" })
    }

    const image = req.file.buffer

    try {
        const user_id = req.user._id;

        const report = await Report.create({ source, description, image, user_id });

        return res.status(200).json(report);
    } catch (error) {
       return res.status(400).json({ error: error.message });
    }
};


module.exports = { createReport }