const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  source: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: Buffer,
    required: true
  },
  user_id: {
    type: String,
    required: true
    }
}, { timestamps: true } );

module.exports = mongoose.model('Report', reportSchema);
