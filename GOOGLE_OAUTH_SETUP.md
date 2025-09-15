# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Online Learning System.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Online Learning System")
4. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" and click on it
3. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "Online Learning System"
     - User support email: Your email
     - Developer contact information: Your email
   - Add your domain to authorized domains
   - Save and continue through the steps

4. For Application type, choose "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)

6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/learning-system

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Session Secret
SESSION_SECRET=your-session-secret-here

# Client URL (for CORS and OAuth redirects)
CLIENT_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

Replace the placeholder values with your actual credentials.

## Step 5: Test the Implementation

1. Start the server: `npm run server`
2. Start the client: `npm run client`
3. Navigate to the login or register page
4. Click "Continue with Google" or "Sign up with Google"
5. Complete the OAuth flow

## Important Notes

- **Student Role Only**: Google OAuth is only available for students, not admins
- **Account Linking**: If a user already exists with the same email, their account will be linked to Google
- **Development vs Production**: Make sure to update the redirect URIs for production deployment
- **Security**: Keep your Client Secret secure and never commit it to version control

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch"**: Check that your redirect URI in Google Console matches exactly
2. **"invalid_client"**: Verify your Client ID and Client Secret are correct
3. **CORS errors**: Ensure CLIENT_URL is set correctly in your environment variables

### Testing OAuth Flow

1. Clear browser cookies and local storage
2. Try the OAuth flow in an incognito window
3. Check server logs for any error messages
4. Verify the callback URL is accessible

## Production Deployment

For production deployment:

1. Update the OAuth consent screen with your production domain
2. Add production redirect URIs to your Google OAuth credentials
3. Set `NODE_ENV=production` in your environment variables
4. Use HTTPS for all URLs in production
5. Update the session configuration to use secure cookies

## Security Considerations

- Use strong, unique secrets for JWT_SECRET and SESSION_SECRET
- Enable HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console
- Implement rate limiting for OAuth endpoints
