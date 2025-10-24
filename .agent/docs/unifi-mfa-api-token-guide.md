# UniFi OS API Token Guide (for MFA-Enabled Accounts)

If your UniFi Cloud Key has Multi-Factor Authentication (MFA) enabled, you cannot use username/password for API access. Instead, you need to generate an API token.

## Steps to Generate API Token

### 1. Log in to UniFi OS Web Interface

Open your browser and go to:
```
https://192.168.1.93
```

Log in with your username, password, and MFA code.

### 2. Access UniFi OS Settings

- Click on the **Settings** icon (gear icon) in the top-right corner
- Select **System Settings**
- Go to the **Advanced** tab

### 3. Generate API Token

Look for one of these sections (depends on your UniFi OS version):

**Option A: Admins & API section**
- Navigate to **Admins & API**
- Scroll to **API Access**
- Click **Create New API Token**
- Give it a name (e.g., "Hospitality SDK")
- Copy the token immediately (you won't see it again!)

**Option B: Users section**
- Navigate to **Users**
- Find your admin user
- Click on your user
- Look for **API Access** or **Generate API Token**
- Click to generate
- Copy the token

### 4. Add Token to .env.local

Add the token to your `.env.local` file:

```bash
UNIFI_IP=192.168.1.93
UNIFI_USER=admin
UNIFI_PASS=.5wiVy_6gc*%iA?
UNIFI_PORT=443
UNIFI_LOCAL_TOKEN=your_api_token_here
```

### 5. Test the Connection

Run the test script:

```bash
npm run unifi:test
```

## Alternative: Use Browser Developer Tools

If you can't find the API token generation UI, you can extract the session token from your browser:

1. Log in to UniFi OS web interface (`https://192.168.1.93`)
2. Open browser Developer Tools (F12)
3. Go to **Application** tab > **Cookies** > `https://192.168.1.93`
4. Find the `TOKEN` cookie
5. Copy its value
6. Add to `.env.local` as `UNIFI_LOCAL_TOKEN`

**Note**: Session tokens expire after a while (usually 24 hours), so this is only for testing. For production, generate a proper API token.

## Verify Token Works

Test with curl:

```bash
curl -k https://192.168.1.93/proxy/network/api/self \
  -H "Cookie: TOKEN=your_token_here"
```

If it returns JSON with your user info, the token works!

## Troubleshooting

### Token not working
- Make sure you copied the entire token (no spaces/newlines)
- Check token hasn't expired (if using session token)
- Verify you're using HTTPS on port 443 (not 8443)

### Can't find API token generation
- Your UniFi OS version might not support local API tokens
- Try the browser Developer Tools method to extract session token
- Consider using UniFi Cloud API instead (no MFA issues)

## Why API Tokens?

MFA prevents username/password authentication in API calls. API tokens:
- ✅ Work with MFA-enabled accounts
- ✅ Can be revoked without changing password
- ✅ Can have limited scopes/permissions
- ✅ Don't expire (unless explicitly revoked)
