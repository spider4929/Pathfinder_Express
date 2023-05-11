const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  source: {
    type: String,
    required: true
  },
  coordinates: {
    type: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    required: true
  },
  category: {
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
  },
  approved: {
    type: Boolean,
    default: false,
  },
  expiry: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 900000);
    }
  }
}, { timestamps: true });

// Schedule document deletion when expiry time is reached
reportSchema.pre('save', function(next) {
  const now = new Date();
  if (now >= this.expiry) {
    // Expiry time already passed, delete document
    this.model('Report').deleteOne({ _id: this._id }).exec();
  }
  const timeToExpiry = this.expiry - now;
  console.log(timeToExpiry, "from pre.save")
  if (this.timeoutId) {
    clearTimeout(this.timeoutId);
  }
  this.timeoutId = setTimeout(() => {
    this.model('Report').deleteOne({ _id: this._id }).exec();
  }, timeToExpiry);
  next();
});

reportSchema.pre('findOneAndUpdate', function(next) {
  const updatedFields = this.getUpdate();
  const now = new Date();

  if (updatedFields.expiry) {
    const doc = this;
    const originalExpiry = doc._update.$set.expiry || doc.expiry;
    const newExpiry = updatedFields.expiry;
    const timeToExpiry = newExpiry - now;
    console.log(timeToExpiry, "from pre.findOneAndUpdate")

    // If the new expiry time is earlier than the original expiry time,
    // update the timeout accordingly.
    if (newExpiry < originalExpiry) {
      clearTimeout(doc.timeoutId);
      doc.timeoutId = setTimeout(() => {
        mongoose.model('Report').deleteOne({ _id: doc.getQuery()._id }).exec();
      }, timeToExpiry);
    }

    // If the document is already expired, delete it immediately.
    if (now >= newExpiry) {
      mongoose.model('Report').deleteOne({ _id: doc.getQuery()._id }).exec();
    } else {
      doc.timeoutId = setTimeout(() => {
        mongoose.model('Report').deleteOne({ _id: doc.getQuery()._id }).exec();
      }, timeToExpiry);
    }
  }

  next();
});


module.exports = mongoose.model('Report', reportSchema);
