const mongoose = require('mongoose');
require('dotenv').config();
const contentSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    unique: true
  }
});

let Content;

// Initialize function
function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGODB);
      
      db.on('error', (err) => {
          reject(err); // reject the promise with the provided error
      });
      db.once('open', () => {
          Content = db.model('Content', contentSchema);
          console.log("db connected")
          resolve();
      });
  });
}

// Fetch all topics (without content)
const getAllTopics = async () => {
  try {
    const topics = await Content.find({}, { topic: 1, order: 1 }).sort({ order: 1 }).exec();
    return topics;
  } catch (err) {
    throw new Error('Error fetching topics: ' + err.message);
  }
};


const getAllContent = async () => {
  try {
    const content = await Content.find({}).sort({ order: 1 }).exec();
    return content;
  } catch (err) {
    throw new Error('Error fetching topics: ' + err.message);
  }
};
// Fetch content by ID
const getContentById = async (id) => {
  try {
    const content = await Content.findById(id).exec();
    return content;
  } catch (err) {
    throw new Error('Error fetching content: ' + err.message);
  }
};

const getContentLength = async () => {
  try{
      const totalDocs = await Content.countDocuments();
      return totalDocs;
  } catch (err) {
      throw new Error('Error fetching total content length: ' + err.message);
  }
};
// Add new content
const addContent = async (topic, body) => {
  try {
    // Get the highest current order and increment it for the new content
    const lastContent = await Content.findOne().sort({ order: -1 }).exec();
    const newOrder = lastContent ? lastContent.order + 1 : 1;

    const newContent = new Content({
      topic,
      body,
      order: newOrder,
    });

    await newContent.save();
    return newContent;
  } catch (err) {
    throw new Error('Error adding content: ' + err.message);
  }
};

// Update content by ID
const updateContent = async (id, updatedData) => {
  try {
    const content = await Content.findByIdAndUpdate(id, updatedData, { new: true }).exec();
    return content;
  } catch (err) {
    throw new Error('Error updating content: ' + err.message);
  }
};

// Delete content by ID
const deleteLastContent = async () => {
  try {
    const lastContent = await Content.findOne().sort({ order: -1 }).exec();
    const deletedContent = await Content.findByIdAndDelete(lastContent._id).exec();
    return deletedContent;
  } catch (err) {
    throw new Error('Error deleting content: ' + err.message);
  }
};


// Export the service functions
module.exports = {
  initialize,
  getAllTopics,
  getContentById,
  addContent,
  updateContent,
  deleteLastContent,
  getContentLength,
  getAllContent
};