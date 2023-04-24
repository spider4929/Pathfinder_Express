const Report = require('../models/reportModel')

// create new report
const createReport = async (req, res) => {
    const { Source, Description } = req.body;

    try {
        const user_id = req.user._id;

        const report = await Report.create({ Source, Description, user_id });

        return res.status(200).json(report);
    } catch (error) {
       return res.status(400).json({ error: error.message });
    }
};


module.exports = { createReport }