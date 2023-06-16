require('dotenv').config()

const axios = require('axios');
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

// display report with image
const getReportWithImage = async (req, res) => {
    const { coordsData } = req.body;
    const user_id = req.user._id
    const response = []
    const reports = await Report.find()

    for (const coordinate of coordsData) {
        for (const a of reports) {
            const aCoords = a.coordinates 
            const distance = haversineDistance(coordinate.latitude, coordinate.longitude, aCoords.latitude, aCoords.longitude)
            if (distance <= thresholdDistance && !a.voter_ids.includes(user_id) && a.user_id != user_id) {
                console.log(a.user_id)
                console.log(user_id)
                const { _id, source, image, coordinates, category, expiry, counter } = a
                const objToAdd = { _id, source, image, coordinates, category, expiry, counter };
                if (!response.some((obj) => obj._id === objToAdd._id)) {
                    response.push(objToAdd);
                }
            }
        }
    }

    res.status(200).json(response)
}

// Check if one or more routes have a counter of 5 in road closure
const roadClosureCheck = async (req, res) => {
  const { coordsData } = req.body;
  const reports = await Report.find()
  let response = false

  for (const coordinate of coordsData) {
    for (const a of reports) {
      const aCoords = a.coordinates 
      const distance = haversineDistance(coordinate.latitude, coordinate.longitude, aCoords.latitude, aCoords.longitude)
      if (distance <= thresholdDistance) {
        const { counter } = a 
        if (counter >= 1) {
          response = true
        }
      }
    }
  }
  res.status(200).json(response)
}

// Check if created report closure is from user itself
const roadClosureSelf = async (req, res) => {
  const { id } = req.params 
  const user_id = req.user._id
  let response = false

  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({error: 'No such report'})
  }

  const report = await Report.findById(id)

  if (!report) {
      return res.status(404).json({error: 'No such report'})
  }

  if (report.user_id == user_id) {
    response = true
  }
  res.status(200).json(response)
}

// create new report
const createReport = async (req, res) => {
  const { source, coordinates, edges, category, description } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: "No image file was uploaded" });
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "Uploaded file is not a valid image" });
  }

  if (req.file.size > 20 * 1024 * 1024) {
    return res.status(400).json({ error: "Uploaded file exceeds the maximum size of 20 MB" });
  }

  const image = req.file.buffer;

  try {
    const safeSearchResponse = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.SAFESEARCH_API}`, {
      requests: [
        {
          image: {
            content: image.toString('base64')
          },
          features: [
            {
              type: 'SAFE_SEARCH_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    });

    const safeSearchResult = safeSearchResponse.data.responses[0];
    const safeSearchAnnotation = safeSearchResult.safeSearchAnnotation;

    const explicitContentLikelihood = safeSearchAnnotation.adult;
    const spoofContentLikelihood = safeSearchAnnotation.spoof;
    const medicalContentLikelihood = safeSearchAnnotation.medical;
    const violenceContentLikelihood = safeSearchAnnotation.violence;
    const racyContentLikelihood = safeSearchAnnotation.racy;

    if (
        explicitContentLikelihood === 'LIKELY' ||
        explicitContentLikelihood === 'VERY_LIKELY' ||
        spoofContentLikelihood === 'LIKELY' ||
        spoofContentLikelihood == 'VERY_LIKELY' ||
        medicalContentLikelihood === 'LIKELY' ||
        medicalContentLikelihood === 'VERY_LIKELY' ||
        violenceContentLikelihood == 'LIKELY' ||
        violenceContentLikelihood == 'VERY_LIKELY' ||
        racyContentLikelihood === 'LIKELY' ||
        racyContentLikelihood === 'VERY_LIKELY'
    ) {
    return res.status(400).json({ error: "Uploading explicit image is not allowed." });
    }

    let found = false;
    const user_id = req.user._id;
    const parsedCoordinates = JSON.parse(coordinates);
    const reports = await Report.find({ category: category });
    for (const a of reports) {
      const aCoords = a.coordinates;
      const distance = haversineDistance(parsedCoordinates.latitude, parsedCoordinates.longitude, aCoords.latitude, aCoords.longitude);
      if (distance <= thresholdDistance && !a.voter_ids.includes(user_id) && a.user_id != user_id) {
        found = true;
        const { expiry, counter } = a;
        await Report.findOneAndUpdate({ _id: a.id }, { expiry: expiry.getTime() + (5 * 60 * 1000), counter: counter + 1 });
      }
    }
    if (found) {
      const tempReport = { source, coordinates: parsedCoordinates, edges, category, description, image, user_id };
      return res.status(200).json(tempReport);
    }
    let closureExpiry;
    if (category === 'closure') {
      closureExpiry = new Date(Date.now() + 86400000);
    }

    const reportData = { source, coordinates: parsedCoordinates, edges, category, description, image, user_id };

    if (closureExpiry) {
      reportData.expiry = closureExpiry;
    }

    const report = await Report.create(reportData);
    return res.status(200).json(report);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Add Expiry
const addExpiry = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id 

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such report'})
    }

    const report = await Report.findById(id)

    if (!report) {
        return res.status(404).json({error: 'No such report'})
    }

    // Add user_id to voter_ids if it doesn't exist
    if (!report.voter_ids.includes(user_id)) {
        report.voter_ids.push(user_id);
    }

    // add 15 minutes to the expiry time
    const newExpiry = new Date(report.expiry.getTime() + 5 * 60000)
    

    report.expiry = newExpiry
    
    report.counter += 1

    const updatedReport = await report.save()

    res.status(200).json(updatedReport)
}

const subtractExpiry = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id  

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such report'})
    }

    const report = await Report.findById(id)

    if (!report) {
        return res.status(404).json({error: 'No such report'})
    }

    // Add user_id to voter_ids if it doesn't exist
    if (!report.voter_ids.includes(user_id)) {
        report.voter_ids.push(user_id);
    }

    // subtract 15 minutes from the expiry time
    const newExpiry = new Date(report.expiry.getTime() - 5 * 60000)

    report.expiry = newExpiry

    // check if the new expiry time is past the current time
    if (newExpiry.getTime() < Date.now()) {
        await Report.findByIdAndDelete(id)
        return res.status(200).json({message: 'Report deleted'})
    }

    const updatedReport = await report.save()

    res.status(200).json(updatedReport)
}




module.exports = { getReport, getReportWithImage, roadClosureCheck, roadClosureSelf, createReport, addExpiry, subtractExpiry }