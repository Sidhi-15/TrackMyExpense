# Google OAuth Authentication Setup Guide

This guide will help you set up Google OAuth authentication for the TrackMyExpenses application.

## Prerequisites

- Google Cloud Project
- Google OAuth 2.0 credentials

## Step-by-Step Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "TrackMyExpenses"
5. Click "CREATE"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on the result and press "ENABLE"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth Client ID"
3. You'll be prompted to create an OAuth consent screen first:
   - Choose "External" for User Type
   - Fill in the required fields:
     - App name: "TrackMyExpenses"
     - User support email: Your email
     - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
4. Skip optional scopes and click "SAVE AND CONTINUE"
5. Click "BACK TO CREDENTIALS"

### 4. Configure OAuth Client

1. Click "CREATE CREDENTIALS" > "OAuth Client ID"
2. Select "Web application"
3. Add Authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3000/`
   - If deploying to production, add your domain:
     - `https://yourdomain.com`
     - `https://yourdomain.com/`

4. Click "CREATE"
5. Copy your **Client ID** (you'll need this)

### 5. Update TrackMyExpenses Configuration

1. Open `views/index.html`
2. Find this line (around line 13):
   ```html
   <div id="g_id_onload" data-client_id="YOUR_GOOGLE_CLIENT_ID"
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Google Client ID from Step 4

4. Open `views/signup.html`
5. Find the same line and update it with your Google Client ID

### 6. Test the Setup

1. Start your application:
   ```bash
   npm start
   ```

2. Navigate to `http://localhost:3000` (Login page)

3. You should see the Google Sign-In button

4. Click it and follow the Google authentication flow

## How It Works

### Login Flow
1. User clicks the Google Sign-In button
2. Google authentication popup appears
3. User authenticates with Google
4. Frontend receives ID token
5. Frontend sends token to `/api/login/google-token` endpoint
6. Backend verifies token and creates/logs in user
7. User is redirected to dashboard

### Signup Flow
1. User clicks the Google Sign-Up button
2. Google authentication popup appears
3. User authenticates with Google
4. Frontend receives ID token
5. Frontend sends token to `/api/signup/google-token` endpoint
6. Backend verifies token and creates new user account
7. User sees success message and redirects to login

## Token Verification

The backend uses a basic JWT decoder to extract user information from the Google token:
- Email address
- Full name
- Existing users are logged in directly
- New users are automatically created

## Security Notes

- Tokens are verified on the backend
- User passwords for OAuth accounts are auto-generated and cryptographically hashed
- Session management is handled server-side
- HTTPS is recommended for production deployments

## Troubleshooting

### "Invalid Google Client ID" Error
- Make sure you've replaced `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
- Check that your Client ID is correct in both `index.html` and `signup.html`

### Google Button Not Showing
- Check browser console for errors
- Verify the Google Sign-In SDK script is loaded: `<script src="https://accounts.google.com/gsi/client" async defer></script>`
- Clear browser cache and reload

### CORS or Network Errors
- Make sure your redirect URIs in Google Cloud Console match your application URL
- For localhost: ensure you're using `http://localhost:3000`

### Token Verification Failed
- Check that the backend is receiving the token correctly
- Verify the token decoder implementation in `server/auth.js`

## Additional Resources

- [Google Sign-In for Web Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## Environment Variables (Optional for Production)

For production, consider storing your configuration in environment variables:

```bash
GOOGLE_CLIENT_ID=your_client_id
NODE_ENV=production
```

Then update the HTML to read from config or use a template system.
