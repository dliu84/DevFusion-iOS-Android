const mongoose = require('mongoose');
require('dotenv').config();

const mcqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    a: { type: String, required: true },
    b: { type: String, required: true },
    c: { type: String, required: true },
    d: { type: String, required: true },
  },
  correctAnswer: {
    type: String,  // This should be 'a', 'b', 'c', or 'd'
    required: true,
  }
});

const testSetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  isCertification: {
    type: Boolean,
    default: false  // Only one can be true
  },
  passingPercentage: {
    type: Number,
    required: true
  },
  mcqs: [mcqSchema]  // Array of MCQs
});

// Model for test sets
const TestSet = mongoose.model('TestSet', testSetSchema);

// Initialize function for DB connection
function initialize() {
  return new Promise(function (resolve, reject) {
    mongoose.connect(process.env.MONGODB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    mongoose.connection.on('error', (err) => {
      reject(err);
    });

    mongoose.connection.once('open', () => {
      console.log("Database connected successfully");
      resolve();
    });
  });
}

// Ensure only one certification test exists
async function ensureOneCertification(isCertification) {
  if (isCertification) {
    // Find if there's an existing certification test
    const certificationTest = await TestSet.findOne({ isCertification: true });
    if (certificationTest) {
      certificationTest.isCertification = false;  // Mark the old certification test as false
      await certificationTest.save();
    }
  }
}

// Add new content
const addTest = async (title, isCertification, passingPercentage, mcqs) => {
  try {
    // Ensure only one certification test
    await ensureOneCertification(isCertification === 'on');
    let newTestSet = new TestSet({
      title,
      isCertification: isCertification === 'on',
      passingPercentage,
      mcqs: mcqs.map(mcq => ({
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer
      })),
    });
    await newTestSet.save();
    return newTestSet;
  } catch (err) {
    throw new Error('Error adding test: ' + err.message);
  }
};

const updateOneTest = async (id, title, isCertification, passingPercentage, mcqs ) => {
    await ensureOneCertification(isCertification === 'on');
    const testSet = await TestSet.findById(id).exec();
    testSet.title = title;
    testSet.isCertification = isCertification === 'on';
    testSet.passingPercentage = passingPercentage;
    testSet.mcqs = mcqs.map(mcq => ({
      question: mcq.question,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer
    }));
    await testSet.save();
}

const findTestSetById = async (id) => {
  try {
    return TestSet.findById(id).exec()
  } catch (err) {
    throw new Error('Error fetching testSets: ' + err.message);
  }
  
}
const deleteById = async(id) => {
  try {
    return await TestSet.findByIdAndDelete(id);
  } catch (err) {
    throw new Error('Error deleting testSet: ' + err.message);
  }
}
// Add new content
const getAllTestSets = async () => {
  try {
    const test = await TestSet.find().exec();
    return test;
  } catch (err) {
    throw new Error('Error fetching TestSets: ' + err.message);
  }
};

module.exports = {
  initialize,
  addTest,
  getAllTestSets,
  updateOneTest,
  findTestSetById,
  deleteById
};
