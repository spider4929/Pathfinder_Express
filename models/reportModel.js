const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  Source: {
    type: String,
    required: true
  },
  Description: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
    }
}, { timestamps: true } );

module.exports = mongoose.model('Report', reportSchema);
