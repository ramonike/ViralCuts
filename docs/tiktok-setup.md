# TikTok for Developers Setup Guide

This guide walks you through setting up TikTok API integration for the multi-platform upload feature.

## Prerequisites

- A TikTok account
- A business or creator account (recommended for Content Posting API access)

## Step 1: Create a TikTok Developer Account

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Click "Log in" and sign in with your TikTok account
3. Accept the developer terms of service

## Step 2: Create a New App

1. Navigate to "Manage apps" in the developer portal
2. Click "Create app"
3. Fill in the required information:
   - **App name**: Your application name (e.g., "CreatorHub")
   - **App description**: Brief description of your app
   - **Category**: Select "Content & Publishing"
   - **Platform**: Select "Web"

## Step 3: Configure OAuth Settings

1. In your app settings, go to "Configuration"
2. Add the following redirect URIs:
   - Development: `http://localhost:3000/api/auth/tiktok/callback`
   - Production: `https://your-domain.com/api/auth/tiktok/callback`

## Step 4: Request API Scopes

For video upload functionality, you need to request the following scopes:

### Required Scopes:
- `user.info.basic` - Access basic user profile information
- `video.upload` - Upload videos to TikTok
- `video.publish` - Publish uploaded videos

### Optional Scopes:
- `video.list` - List user's videos
- `user.info.profile` - Access detailed profile information

## Step 5: Apply for Content Posting API Access

> **Important**: The Content Posting API requires approval from TikTok.

1. Go to "Products" in your app settings
2. Select "Content Posting API"
3. Click "Apply for access"
4. Fill out the application form:
   - Describe your use case
   - Explain how you'll use the API
   - Provide sample content if requested
5. Wait for approval (typically 1-2 weeks)

## Step 6: Get Your Credentials

Once your app is approved:

1. Go to your app's "Configuration" page
2. Copy the following values:
   - **Client Key** (also called App ID)
   - **Client Secret**

## Step 7: Configure Environment Variables

Add the following to your `.env` file:

```env
# TikTok API Configuration
TIKTOK_CLIENT_KEY=your-client-key-here
TIKTOK_CLIENT_SECRET=your-client-secret-here
TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/tiktok/callback
VITE_TIKTOK_CLIENT_KEY=your-client-key-here
```

## API Endpoints Reference

### OAuth Authorization URL
```
https://www.tiktok.com/v2/auth/authorize/
```

### Token Exchange URL
```
https://open.tiktokapis.com/v2/oauth/token/
```

### Content Posting API Base URL
```
https://open.tiktokapis.com/v2/post/publish/
```

## Video Requirements

TikTok has specific requirements for uploaded videos:

| Requirement | Value |
|-------------|-------|
| Max Duration | 10 minutes |
| Min Duration | 1 second |
| Max File Size | 4GB |
| Supported Formats | MP4, WebM, MOV |
| Aspect Ratios | 9:16 (recommended), 1:1, 16:9 |
| Resolution | 720p minimum, 1080p recommended |

## Rate Limits

- **Video uploads**: 20 per day per user
- **API calls**: 1000 per day per app (varies by endpoint)

## Troubleshooting

### Common Issues

1. **"App not approved"**: Ensure you've applied for Content Posting API access
2. **"Invalid redirect URI"**: Check that your redirect URI exactly matches what's configured in the developer portal
3. **"Scope not authorized"**: Request the required scopes in your app settings

### Support

- [TikTok Developer Documentation](https://developers.tiktok.com/doc/)
- [TikTok Developer Forum](https://developers.tiktok.com/forum/)

## Next Steps

After completing this setup:
1. Implement the TikTok OAuth flow (Task 1.2) ✅
2. Implement video upload functionality (Task 1.3) ✅
3. Create backend endpoints (Task 1.4)

## Video Upload API Usage

Once configured, you can upload videos using the TikTok service:

```javascript
import tiktokService from './server/services/platforms/tiktok.js';

// Upload a video
const result = await tiktokService.uploadVideo(
  videoBuffer,
  {
    title: 'My awesome video',
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    disableComment: false,
    disableDuet: false,
    disableStitch: false,
  },
  accessToken,
  {
    onProgress: (bytesUploaded, totalBytes, status) => {
      console.log(`Progress: ${Math.round(bytesUploaded / totalBytes * 100)}%`);
    }
  }
);

// Check publish status
const status = await tiktokService.getPublishStatus(result.publishId, accessToken);
console.log('Status:', status.status);

// Or wait for publish to complete
const finalStatus = await tiktokService.waitForPublish(result.publishId, accessToken);
console.log('Video URL:', finalStatus.videoUrl);
```

### Chunked Upload

For large videos (up to 4GB), the service automatically handles chunked uploads:
- Files < 20MB: Single chunk upload
- Files 20MB - 500MB: 10MB chunks
- Files 500MB - 2GB: 32MB chunks
- Files > 2GB: 64MB chunks

### Privacy Levels

- `PUBLIC_TO_EVERYONE` - Anyone can view
- `MUTUAL_FOLLOW_FRIENDS` - Only mutual followers
- `FOLLOWER_OF_CREATOR` - Only your followers
- `SELF_ONLY` - Only you (private)
