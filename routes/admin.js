const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const contentService = require('../modules/content-service');
const testService = require('../modules/test-service');
const { updateProgressForAllUsers } = require('../modules/user-service');

function checkRole(role) {
  return (req, res, next) => {
    const roles = req.oidc.idTokenClaims && req.oidc.idTokenClaims['https://devfusion/roles'];

    if (!roles || !roles.includes(role)) {
      return res.status(403).render('error-page', {
        title: 'Access Denied',
        header: 'Access Denied',
        message: 'You do not have the required role to access this page.'
      });
    }
    // If the user has the required role, proceed
    next();
  };
}

// Render admin page to create/manage tests
router.get('/test', requiresAuth(), checkRole('admin'), async (req, res) => {
  const testSets = await testService.getAllTestSets();
  res.render('admin-test', { testSets });
});

// Add a new test set
router.post('/test/add', requiresAuth(), checkRole('admin'), async (req, res) => {
  const { title, isCertification, passingPercentage, mcqs } = req.body;
  console.log( title, isCertification, passingPercentage, mcqs);
  await testService.addTest( title, isCertification, passingPercentage, mcqs);
  res.redirect('/admin/test');
});

// Route to get test data for editing
router.get('/test/:id/edit', requiresAuth(), checkRole('admin'), async (req, res) => {
  try {
    const testSet = await testService.findTestSetById(req.params.id);
    res.json(testSet);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching test set: ' + err.message });
  }
});

// Route to update test set
router.post('/test/:id/update', requiresAuth(), checkRole('admin'), async (req, res) => {
  const { title, isCertification, passingPercentage, mcqs } = req.body;

  try {
    // Ensure only one certification test
    await testService.updateOneTest(req.params.id, title, isCertification, passingPercentage, mcqs);
    res.redirect('/admin/test');
  } catch (err) {
    res.status(500).send('Error updating test set: ' + err.message);
  }
});

// Route to delete a test set
router.delete('/test/:id/delete', requiresAuth(), checkRole('admin'), async (req, res) => {
  try {
    await testService.deleteById(req.params.id);
    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting test set: ' + err.message });
  }
});

// Get admin portal with content list
router.get('/', requiresAuth(), checkRole('admin'), async (req, res) => {
  const { search, sortBy, filterType } = req.query;
  let contentList = await contentService.getAllTopics();
  
  // Filter by content type if provided
  if (filterType) {
    contentList = contentList.filter(item => item.type === filterType);
  }

  // Sort by title or date
  if (sortBy === 'topic') {
    contentList.sort((a, b) => a.topic.localeCompare(b.topic));
  } else if (sortBy === 'date') {
    contentList.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate));
  }

  // Search by topic or keywords
  if (search) {
    contentList = contentList.filter(item => 
      item.topic.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.render('admin-content', { contentList, search, sortBy, filterType });
});

// Get specific content for editing
router.get('/content/:id/edit', requiresAuth(), checkRole('admin'), async (req, res) => {
  const content = await contentService.getContentById(req.params.id);
  res.json(content);
});

// Add new content
router.post('/content', requiresAuth(), checkRole('admin'), async (req, res) => {
  const { topic, body } = req.body;
  await contentService.addContent(topic, body);
  res.redirect('/admin');
});

// Update content
router.post('/content/:id/update', requiresAuth(), checkRole('admin'), async (req, res) => {
  const { topic, body } = req.body;
  await contentService.updateContent(req.params.id, { topic, body });
  res.redirect('/admin');
});

// Delete content
router.delete('/content/delete', requiresAuth(), checkRole('admin'), async (req, res) => {
  try {
    const deletedContent = await contentService.deleteLastContent();
    await updateProgressForAllUsers(deletedContent.order -1);
    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete content in index.js', error: err });
  }
});

module.exports = router;
