# Extract UniFi Session Token from Browser (UCK-G2-Plus)

Since the UCK-G2-Plus doesn't have a visible API token generation UI, you can extract the session token from your browser after logging in.

## Steps

### 1. Log in to UniFi OS

1. Open browser and go to: `https://192.168.1.93`
2. Log in with your username, password, and MFA code
3. Wait until you see the UniFi dashboard

### 2. Open Browser Developer Tools

**Chrome/Edge:**
- Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

**Firefox:**
- Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

**Safari:**
- Enable Developer menu: Safari > Preferences > Advanced > Show Develop menu
- Press `Cmd+Option+I`

### 3. Navigate to Cookies

1. In DevTools, click on the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
2. Expand **Cookies** in the left sidebar
3. Click on `https://192.168.1.93`

### 4. Find and Copy TOKEN

1. Look for a cookie named `TOKEN`
2. Double-click the **Value** column for TOKEN
3. Copy the entire value (it's a long string like `eyJhbGci...`)

**Important**:
- Copy the ENTIRE token value
- Don't include any spaces or newlines
- It should be quite long (300+ characters)

### 5. Add to .env.local

Edit your `.env.local` file and add the token:

```bash
UNIFI_IP=192.168.1.93
UNIFI_USER=admin
UNIFI_PASS=.5wiVy_6gc*%iA?
UNIFI_PORT=443
UNIFI_LOCAL_TOKEN=eyJhbGci...your_very_long_token_here...
```

**Note**: Remove any line breaks if the token wraps in your editor - it should be one continuous line.

### 6. Test the Connection

Run the test script:

```bash
npm run unifi:test
```

You should see:
```
✅ Connected via API token
✅ Found X Access Point(s)
✅ Found X connected client(s)
```

## Screenshot Guide

Here's what to look for in DevTools:

```
Application Tab
├── Storage
│   ├── Local Storage
│   ├── Session Storage
│   └── Cookies
│       └── https://192.168.1.93  ← Click here
│           ├── TOKEN  ← This is what you need!
│           │   Name: TOKEN
│           │   Value: eyJhbGci... ← Copy this value
│           └── ...other cookies
```

## Verify Token Works

Test with curl to verify the token:

```bash
# Replace YOUR_TOKEN with the token you copied
curl -k https://192.168.1.93/proxy/network/api/self \
  -H "Cookie: TOKEN=YOUR_TOKEN"
```

If it returns JSON with your user info, the token works!

## Important Notes

### Token Expiration
- Session tokens typically expire after **24 hours** of inactivity
- If the test stops working, just extract a fresh token
- For permanent access, we'll need to find another solution

### Security
- Keep this token secret (like a password)
- Anyone with this token has full access to your UniFi controller
- The `.env.local` file is in `.gitignore` so it won't be committed

## Troubleshooting

### Can't find TOKEN cookie
- Make sure you're logged in to UniFi OS (not just the Network app)
- Try refreshing the page and checking again
- Clear browser cache and log in fresh

### Token value is very short (< 50 characters)
- You might have copied a different cookie
- Look specifically for one named `TOKEN` (all caps)

### Still not working
- Try the UniFi Cloud API instead (no local token needed)
- We can set that up if you prefer
