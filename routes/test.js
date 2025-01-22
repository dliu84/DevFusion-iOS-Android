const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const testService = require("../modules/test-service");
const userService = require("../modules/user-service");
const contentService = require("../modules/content-service");

// Fetch available test sets
router.get('/', requiresAuth(), async (req, res) => {
  const tests = await testService.getAllTestSets();
  res.render('tests', { tests });
});

// Show instructions page
router.get('/:id/instructions', requiresAuth(), async (req, res) => {
  const { id } = req.params;
  const test = await testService.findTestSetById(id);
  const contentLength = await contentService.getContentLength();
  const userProgress = await userService.fetchProgress(req.session.user.email); // Assuming user is logged in
  res.render('instructions', { test, progress: userProgress, contentLength });
});

// Start test
router.get('/:id/start', requiresAuth(), async (req, res) => {
  const { id } = req.params;
  const test = await testService.findTestSetById(id);
  res.render('test', { questions: test.mcqs, id: test._id, test });
});

// Route to handle result submission and processing
router.post('/:id/result', async (req, res) => {
  try {
      // 1. Retrieve test and user data
      const { id } = req.params;
      const userResponses = req.body; // Extract all user answers
      const test = await testService.findTestSetById(id); // Fetch test with ID

      if (!test) {
          return res.status(404).send('Test not found.');
      }

      let score = 0; // Initialize score counter

      // 2. Iterate through questions and compare user answers
      test.mcqs.forEach((question, index) => {
          const userAnswer = userResponses[`answer_${index}`]; // Example: 'a', 'b', etc.
          if (userAnswer === question.correctAnswer) {
              score++;
          }
      });

      // 3. Calculate passing percentage
      const passingPercentage = (score / test.mcqs.length) * 100;
      const isPass = passingPercentage >= test.passingPercentage; // Check if user passed

      // 4. If the test is a certification and the user passed, update status
      if (test.isCertification && isPass) {
          await userService.updateIsPass(req.session.user.email, true);
      }

      // 5. Render result page with score and status
      res.render('result', {
          testTitle: test.title,
          totalQuestions: test.mcqs.length,
          score,
          passingPercentage,
          isPass,
          isCertification:test.isCertification
      });
  } catch (error) {
      console.error('Error processing the result:', error);
      res.status(500).send('An error occurred while processing the result.');
  }
});

// Submit test
router.post('/:id/submit', requiresAuth(), async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  const test = await testService.findTestSetById(id);
  const user = await userService.fetchUserInfo(req.session.user.email);

  // Calculate score
  let score = 0;
  test.mcqs.forEach((q, i) => {
    if (q.correctAnswer === answers[i]) score++;
  });

  const percentage = (score / test.mcqs.length) * 100;
  const isPass = percentage >= test.passingPercentage;

  // Update user status if certification test and passed
  if (test.isCertification && isPass) {
    user.isPass = true;
    await user.save();
  }

  res.render('result', { score, percentage, isPass });
});

module.exports = router;
