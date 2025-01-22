const axios = require('axios');
require('dotenv').config();

// Function to update user profile
async function updateUserProfile(userId, updatedData, req) {
  try {
    // Get the access token for the Management API
    const accessToken = await getAccessToken(req);
    
    // Make a request to the Auth0 Management API
    const response = await axios.patch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${userId}`,
      updatedData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Function to get the access token
async function getAccessToken(req) {
  const response = await axios.post(
    `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, // Auth0 token endpoint
    {
      client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET, // Your Management API client secret
      audience: `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/`,
      grant_type: 'client_credentials',
      scope: 'update:users'
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.access_token;
}

// Example route to update user profile

module.exports = { updateUserProfile }