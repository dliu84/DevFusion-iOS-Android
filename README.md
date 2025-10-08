# DevFusion-iOS-Android

## Overview
**DeveFusion-iOS-Android** is a user-friendly learning application designed to enhance the educational experience. It provides a platform where users can engage with structured learning modules, take tests to evaluate their knowledge, receive certificates upon completion, and share feedback through reviews. This system is ideal for learners looking to track their progress, receive immediate feedback, and engage with the learning community.

## Key Features
- **Structured Learning**: Users can explore various educational modules.
- **Instant Feedback**: After completing quizzes, users receive immediate feedback on their performance.
- **Certification**: Successful completion of a quiz generates a certificate for the user, marking their achievement.
- **Review System**: Users can post reviews and rate modules, providing valuable feedback for future improvements.
  
## Technology Stack
- **Frontend**: JavaScript, EJS framework (for rendering dynamic HTML templates).
- **Backend**: Node.js, Express.js for handling server-side logic.
- **Database**: MongoDB, a NoSQL database for storing unstructured and structured data.
- **Authentication**: OAuth 2.0 and JWT (JSON Web Tokens) for secure user authentication and session management.
- **Deployment**: Render, a platform for deploying and hosting the web application.

## Project Structure
- **User Registration and Login**: Users can sign up and log in using their email and password, with JWT handling secure sessions.
- **Learning Modules**: Educational content organized into modules, each with an associated quiz to test users' understanding.
- **Test and Certification**: After completing a module and quiz, users receive feedback, and successful completions are rewarded with a certificate.
- **User Reviews**: Users can rate and post feedback about modules to help others make informed learning decisions.

## Installation and Setup
#### Include the .env file and MongoDB connection string:
- .env file:
  
  `AUTH0_BASE_URL=http://localhost:8080`
  `AUTH0_CLIENT_ID=YsNKc11MxYT6zFcSyFhaVKspebFZI4BM` 
  `AUTH0_ISSUER_BASE_URL=https://dev-05kn13144ags0es2.us.auth0.com` 
  `AUTH0_CLIENT_SECRET=jZSni3FXH0FbsKbHk8MnzyH9ULi3pdxbgIefohQI6WE-pOPKF2x1l5xdxVj_lb3l` 
  `AUTH0_MANAGEMENT_CLIENT_ID=FYDJYX12kbcUtIwFE6QVfUM1fFNWD6yp` 
  `AUTH0_MANAGEMENT_CLIENT_SECRET=IDhXOOTEGAjVWdSPwYukTr8U8Ghd9KRmYcUtbmya8NDm-tf-7gWWvQPdWQQun-MB`

- MongoDB connection string:

  `mongodb+srv://devfusion:cxCLYDSGXbmKDBII@cluster0.qdqqr.mongodb.net`

#### Install Dependencies:
- Run the following command to install all necessary dependencies:

  `npm install`

#### Build the Project:
- Build the project by running:

  `npm run tw:build`

#### Start the Application:
- Start the application using the following command:

  `npm start`

#### Check Locally:
- Once the app is running, visit http://localhost:8080 to access the application locally.

#### Live Deployment
- The stable version of the application is deployed on Render and can be accessed here:
- https://devfusion-ios-android.onrender.com

## Contributors

- **Professor Yasser Elmankabady** (Instructor, Seneca Polytechnic, PRJ666, 2024 Fall)  
- **Di Liu** - [dliu84](https://github.com/dliu84)  
- **Omkar Bharat Patel** - [Omkarpatel07 ](https://github.com/Omkarpatel07 )
- **Shivkuma Hiteshkumar Patel** - [patelshiv1524](https://github.com/patelshiv1524)
- **Vanshika Sharma** - [Vsharma176](https://github.com/Vsharma176)

Thank you for your valuable contributions to this project!  

## License

This project is licensed under the [MIT License](LICENSE).
