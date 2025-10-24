# UniFi Cloud API Setup Guide

The UniFi Cloud API provides remote access to your UniFi network without needing to be on the local network. This is ideal for production deployments and remote management.

## Benefits of UniFi Cloud API

✅ **Remote Access**: Works from anywhere (no VPN needed)
✅ **No MFA Issues**: Uses API keys instead of username/password
✅ **Centralized Management**: One key for all properties
✅ **Automatic Updates**: Always uses latest UniFi features
✅ **Better Security**: Scoped API keys, easy to revoke

## Prerequisites

1. UniFi account at https://account.ui.com/
2. UniFi controller adopted to UniFi Cloud (already done if you have UCK-G2-Plus)
3. Owner or admin access to the controller

## Step-by-Step Setup

### 1. Log in to UniFi Account

Go to: https://account.ui.com/
Log in with your Ubiquiti account credentials (same as UniFi OS login)

### 2. Navigate to API Section

**Method A: Via Account Settings**
1. Click your profile icon (top-right)
2. Select **Account Settings**
3. Navigate to **API** tab in the left sidebar

**Method B: Direct Link**
Go directly to: https://account.ui.com/api

### 3. Generate Cloud API Key

1. Click **Create New API Key** or **Generate API Key**
2. Give it a descriptive name:
   - Example: "Hospitality SDK - Production"
   - Example: "Guest Location Tracking"
3. **Important**: Copy the API key immediately!
   - It will only be shown once
   - Store it securely (password manager recommended)

### 4. Add API Key to .env.local

Edit your `.env.local` file and add:

```bash
UNIFI_IP=192.168.1.93
UNIFI_USER=admin
UNIFI_PASS=.5wiVy_6gc*%iA?
UNIFI_PORT=443
UNIFI_LOCAL_TOKEN=your_session_token_here
UNIFI_CLOUD_KEY=your_cloud_api_key_here  # Add this line
```

### 5. Test Cloud API Connection

Run the test script:

```bash
npm run unifi:test
```

You should see:
```
✅ Connected via: CLOUD
☁️  Using UniFi Cloud API (recommended)
```

## Verify Cloud API is Working

Test with curl:

```bash
# Replace YOUR_API_KEY with your actual key
curl https://api.ui.com/ea/sites \
  -H "x-api-key: YOUR_API_KEY"
```

Expected response:
```json
{
  "data": [
    {
      "_id": "...",
      "name": "default",
      "desc": "Default"
    }
  ]
}
```

## Priority: Cloud First, Local Fallback

Our UnifiedUniFiClient tries Cloud API first:

```typescript
const client = new UnifiedUniFiClient({
  cloudApiKey: process.env.UNIFI_CLOUD_KEY,  // Tried first
  localUrl: process.env.UNIFI_IP,            // Fallback
  localApiToken: process.env.UNIFI_LOCAL_TOKEN,
});
```

**Connection flow:**
1. Try Cloud API (if `cloudApiKey` provided)
2. If fails, try local controller with API token
3. If fails, try local controller with username/password

## Security Best Practices

### Rotating API Keys

Rotate your Cloud API keys every 90 days:

1. Generate new key at https://account.ui.com/api
2. Update `.env.local` with new key
3. Test connection
4. Delete old key

### Key Scoping

- Use different keys for dev/staging/production
- Name keys clearly to track usage
- Revoke unused keys immediately

### Storage

❌ **Never**:
- Commit API keys to git
- Share keys via email/Slack
- Use same key across multiple projects

✅ **Always**:
- Store in `.env.local` (in `.gitignore`)
- Use password manager for backup
- Use environment variables in production

## Troubleshooting

### "Invalid API key" error

- Verify you copied the entire key (no spaces/newlines)
- Check key hasn't been revoked in account settings
- Ensure you're using the UniFi Cloud key (not local controller token)

### "Site not found" error

- Your controller might not be adopted to UniFi Cloud
- Try adopting controller at https://unifi.ui.com/
- Verify you can see your controller in UniFi Cloud console

### Still getting LOCAL connection

- Cloud API key might not be set in `.env.local`
- Check environment variable is loading: `echo $UNIFI_CLOUD_KEY`
- Verify dotenv is configured in your script

## Production Deployment

For production (AWS, Vercel, etc.):

1. Set environment variable:
   ```bash
   # AWS Lambda/ECS
   UNIFI_CLOUD_KEY=your_key_here

   # Vercel
   vercel env add UNIFI_CLOUD_KEY
   ```

2. Don't set local controller variables in production:
   - No `UNIFI_IP` (local network only)
   - No `UNIFI_LOCAL_TOKEN` (session expires)
   - Only use `UNIFI_CLOUD_KEY`

3. Monitor API usage:
   - Check rate limits
   - Log failed requests
   - Set up alerts for authentication failures

## Multi-Property Setup

If you have multiple properties:

### Option A: One key per property
```bash
UNIFI_CLOUD_KEY_PROPERTY_1=key1
UNIFI_CLOUD_KEY_PROPERTY_2=key2
```

### Option B: One key for all (recommended)
```bash
UNIFI_CLOUD_KEY=shared_key
```

The UniFi Cloud API automatically provides access to all sites/properties your account manages.

## Cost Considerations

UniFi Cloud API:
- ✅ **FREE** (no additional cost)
- No per-request charges
- No bandwidth charges
- Included with UniFi account

## Next Steps

After Cloud API is set up:

1. ✅ Test remote access (disconnect from property WiFi)
2. ✅ Run location tracking demo
3. ✅ Deploy to production environment
4. ✅ Set up monitoring and alerts

## Support

- UniFi Cloud API Docs: https://developer.ui.com/
- Community Forums: https://community.ui.com/
- Status Page: https://status.ui.com/
