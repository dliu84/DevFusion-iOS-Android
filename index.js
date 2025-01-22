const authData = require("./modules/user-service");
const contentService = require("./modules/content-service");
const testService = require('./modules/test-service');
const clientSessions = require("client-sessions");
const express = require('express');
const app = express();
const path = require('path');
const { auth, requiresAuth } = require('express-openid-connect');
const { updateUserProfile } = require("./modules/profile");

// Routes
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/test');


// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true, 
  authorizationParams: {
    response_type: 'code id_token', 
    scope: 'openid profile email', 
  }, 
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};
app.use(auth(config));

const HTTP_PORT = process.env.PORT || 8080;

require('dotenv').config();

app.use(express.static('public'));
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(
  clientSessions({
    cookieName: 'session', 
    secret: 'o6Lj2Q5EVNC28Z2g2K26242h2D2E2L2M2128ScpFQr', 
    duration: 10 * 60 * 1000, 
    activeDuration: 1000 * 600, 
  })
);
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use('/admin', adminRoutes);
app.use('/test', testRoutes);

async function ensureUserSession(req) {
  // Check if req.session.user is defined and has an email property
  if (req.session.user && req.session.user.email) {
    // Return the session user if it is already set
    return req.session.user;
  }
  
  try {
    // Fetch user info from Auth0
    const userInfo = await req.oidc.fetchUserInfo();

    // Set user information in session
    req.session.user = {
      name: userInfo.nickname,
      fullName: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      isAdmin: userInfo['https://devfusion/roles'] && userInfo['https://devfusion/roles'].includes('admin')
    };

    // Return the updated session user
    return req.session.user;
  } catch (error) {
    console.error('Error fetching user info from Auth0:', error);
    return null;
  }
}

app.get('/', async (req, res) => {
  if(!req.oidc.isAuthenticated()){
    req.session.destroy((err) => {
      if (err) {
        console.error('Failed to destroy session:', err);
      }
  });
  res.clearCookie('skipSilentLogin');  
  res.clearCookie('appSession');  
  res.clearCookie('session');  
  }
  else {
    try {
      // Fetch user info after successful login
      await ensureUserSession(req);
      // const userInfo = await req.oidc.fetchUserInfo();
      
      // req.session.user = {
      //   name: userInfo.nickname,
      //   email: userInfo.email,
      //   picture: userInfo.picture,
      //   isAdmin: userInfo['https://devfusion/roles'] && userInfo['https://devfusion/roles'].includes('admin')
      // };
      await authData.registerUser({email: req.session.user.email});
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  }
  const [ratingSummary, recentReviews] = await Promise.all([
    authData.getRatingSummary(),
    authData.getRecentReviews()
  ]);

  const { summary, avgRating, totalReviews } = ratingSummary;

    res.render('home', {
      avgRating,
      totalReviews,
      summary,
      recentReviews
    });
});

app.get('/home', async (req, res) => {
  res.redirect('/');
});

// Route for verify email
app.get('/verify-email', requiresAuth(), (req, res) => {
  res.render('verify-email');
});

// Route for Get Certified page
app.get('/certification', requiresAuth(), async (req, res) => {
  await ensureUserSession(req);
  const isPass = await authData.fetchIsPass(req.session.user.email);
  res.render('certification', {userName: req.session.user.fullName, isPass});
});


app.get('/profile', requiresAuth(), async (req, res) => {
  const [totalContent, fetchUpdatedUser] = await Promise.all([
    contentService.getContentLength(),
    req.oidc.fetchUserInfo()
  ]);
  const progress = await authData.fetchProgress(fetchUpdatedUser.email)
  req.session.user = {
    name: fetchUpdatedUser.nickname,
    fullName: fetchUpdatedUser.name,
    email: fetchUpdatedUser.email,
    picture: fetchUpdatedUser.picture,
    isAdmin: fetchUpdatedUser['https://devfusion/roles'] && fetchUpdatedUser['https://devfusion/roles'].includes('admin')
  };
  res.render('profile', {
    profile: fetchUpdatedUser,
    progress,
    totalContent
  });
});

app.post('/profile/update', async (req, res) => {
  const { name, nickname, picture } = req.body;
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).render('error-page', {
      title: 'Unauthorized',
      header: 'Unauthorized',
      message: 'You are not authorized to update the profile.'
    });
  }

  const userId = req.oidc.user.sub; // Auth0 user ID
  const updatedData = {
    name,
    nickname,
    picture
  };

  try {
    await updateUserProfile(userId, updatedData, req);
    res.redirect('/profile');
  } catch (error) {
    return res.status(500).render('error-page', {
      title: 'Failed',
      header: 'Failed',
      message: 'Failed to update user profile.'
    });
  }
});
app.get('/content', requiresAuth(), async (req, res) => {
  let [progress, content ] = await Promise.all([
    authData.fetchProgress(req.session.user.email),
    contentService.getAllContent()
  ]);
  

  if(req.query.order && req.query.order > progress){
    progress = req.query.order;
    authData.updateProgress(req.session.user.email, progress);
  } else if(progress == 0){
    progress = 1;
    authData.updateProgress(req.session.user.email, progress);
  }

  const selectedOrder = parseInt(req.query.order) || progress; // Default to current progress
  const selectedTopic = content.find(t => t.order === selectedOrder);

  const prevOrder = selectedOrder > 1 ? selectedOrder - 1 : null;
  const nextOrder = selectedOrder < content.length ? selectedOrder + 1 : null;
  res.render('content', { content, selectedTopic, prevOrder, nextOrder });
});

app.get('/Feedback', async (req, res) => {
  await ensureUserSession(req);
  const feedback = await authData.fetchFeedback(req.session.user.email);
  res.render('feedback', { feedback });
});

app.post('/Feedback', async (req, res) => {
  const feedbackData = {
    message: req.body.comment,
    rating: req.body.rate
  };
  await ensureUserSession(req);
  try {
    await authData.addOrUpdateFeedback(req.session.user.email, feedbackData);
    res.redirect('/home'); // Redirect to the home page after saving feedback
  } catch (err) {
    console.error("Error saving feedback: ", err);
    res.render('feedback', { feedback: feedbackData, errorMessage: "There was an error saving your feedback. Please try again." });
  }
});

app.use((req, res) => {
  res.redirect('/');
});

Promise.all([contentService.initialize(), authData.initialize(), testService.initialize()])
.then(()=>{
  app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`) });
}).catch((err) => {
  console.log(`unable to start server: ${err}`);
});

module.exports = app;