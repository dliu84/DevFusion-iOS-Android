const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('dotenv').config();

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  isPass: {
    type: Boolean,
    default: false
  },
  feedback: {
    message: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }
});


let User;

// Initialize function
function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGODB);
      
      db.on('error', (err) => {
          reject(err); // reject the promise with the provided error
      });
      db.once('open', () => {
          User = db.model("users", userSchema);
          console.log("db connected")
          resolve();
      });
  });
}

// Register User function
function registerUser(userData) {
  return new Promise(async function (resolve, reject) {
    try {
      // Check if a user with the given email already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        // If user exists, simply resolve
        resolve("User already exists");
      } else {
        // Initialize progress to 0 and create a new user
        userData.progress = 0;
        userData.isPass = false;
        let newUser = new User(userData);

        await newUser.save(); // Save the new user
        resolve("User registered successfully");
      }
    } catch (err) {
      if (err.code === 11000) {
        reject("Email already taken");
      } else {
        reject("There was an error creating the user: " + err);
      }
    }
  });
}

// Fetch Progress function
async function fetchUserInfo(email) {
  return new Promise((resolve, reject) => {
    User.findOne({ email: email }).then(user => {
      if (!user) {
        return reject("No user found with that email address");
      }
      resolve(user);
    }).catch((err) => reject("There was an error finding the user: " + err));
  });
}

// Fetch Progress function
async function fetchProgress(email) {
  return new Promise((resolve, reject) => {
    User.findOne({ email: email }).then(user => {
      if (!user) {
        return reject("No user found with that email address");
      }
      resolve(user.progress);
    }).catch((err) => reject("There was an error finding the user: " + err));
  });
}

// Update Progress function
async function updateProgress(email, newProgress) {
  return new Promise((resolve, reject) => {
    if (newProgress < 0 || newProgress > 10) {
      return reject("Progress must be between 0 and 10");
    }
    User.findOne({ email: email }).then(user => {
      if (!user) {
        return reject("No user found with that email address");
      }
      user.progress = newProgress;
      user.save()
        .then(() => resolve("Progress updated successfully"))
        .catch((err) => reject("There was an error updating the progress: " + err));
    }).catch((err) => reject("There was an error finding the user: " + err));
  });
}
// Fetch isPass function
async function fetchIsPass(email) {
  return new Promise((resolve, reject) => {
    User.findOne({ email: email }).then(user => {
      if (!user) {
        return reject("No user found with that email address");
      }
      resolve(user.isPass);
    }).catch((err) => reject("There was an error finding the user: " + err));
  });
}

// Update isPass function
async function updateIsPass(email, isPass) {
  return new Promise((resolve, reject) => {
    User.findOne({ email: email }).then(user => {
      if (!user) {
        return reject("No user found with that email address");
      }
      user.isPass = isPass;
      user.save()
        .then(() => resolve("isPass updated successfully"))
        .catch((err) => reject("There was an error updating isPass: " + err));
    }).catch((err) => reject("There was an error finding the user: " + err));
  });
}

async function addOrUpdateFeedback(email, feedbackData) {
  return new Promise((resolve, reject) => {
    if (feedbackData.rating < 1 || feedbackData.rating > 5) {
      return reject("Rating must be between 1 and 5");
    }
    User.findOne({ email: email }).then(user => {
      if (!user) {
        return reject("No user found with that email address");
      }
      user.feedback = {
        message: feedbackData.message,
        rating: feedbackData.rating
      };
      user.save()
        .then(() => resolve("Feedback updated successfully"))
        .catch((err) => reject("There was an error updating the feedback: " + err));
    }).catch((err) => reject("There was an error finding the user: " + err));
  });
}

function fetchFeedback(email) {
  return new Promise((resolve, reject) => {
    User.findOne({ email: email }).then(user => {
      if (!user) {
        return reject("No user found with that email address");
      }
      if (!user.feedback) {
        return reject("No feedback found for this user");
      }
      resolve(user.feedback);
    }).catch((err) => reject("There was an error finding the user: " + err));
  });
}


async function updateProgressForAllUsers(maxProgress) {
  try {
    // Find all users whose progress exceeds maxProgress
    const usersToUpdate = await User.find({ progress: { $gt: maxProgress } });

    if (usersToUpdate.length === 0) {
      return { message: 'No users found with progress exceeding maxProgress.' };
    }

    // Update progress for each user and save changes
    const updatePromises = usersToUpdate.map(async (user) => {
      user.progress = maxProgress;
      return user.save();
    });

    // Wait for all updates to complete
    const updatedUsers = await Promise.all(updatePromises);

    return {
      message: 'User progress updated successfully.',
      updatedCount: updatedUsers.length,
    };
  } catch (error) {
    console.error('Error updating progress for all users:', error);
    return { error: 'Failed to update user progress.' };
  }
}

const getRatingSummary = async () => {
  const summary = await User.aggregate([
    { $match: { "feedback.rating": { $exists: true } } },
    { $group: {
        _id: "$feedback.rating",
        count: { $sum: 1 },
        average: { $avg: "$feedback.rating" }
      }
    }
  ]);

  const totalReviews = summary.reduce((sum, item) => sum + item.count, 0);
  const avgRating = summary.reduce((sum, item) => sum + item._id * item.count, 0) / totalReviews;

  return { summary, avgRating, totalReviews };
};

const getRecentReviews = async (ratingFilter) => {
  const filter = { 
    ...(ratingFilter ? { "feedback.rating": ratingFilter } : { "feedback.rating": { $exists: true, $ne: null } })
  };
  return await User.find(filter, { "feedback.message": 1, "feedback.rating": 1 })
                   .sort({ _id: -1 })
                   .limit(5)
                   .lean();
};


// Export the functions
module.exports = {
  initialize,
  fetchUserInfo,
  registerUser,
  fetchProgress,
  updateProgress,
  fetchIsPass,
  updateIsPass,
  addOrUpdateFeedback,
  fetchFeedback,
  updateProgressForAllUsers,
  getRatingSummary,
  getRecentReviews
};

