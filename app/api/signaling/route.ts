/**
 * WebRTC Signaling Server (Next.js API Route)
 *
 * Cloud-hosted signaling server for WebRTC P2P connections.
 * Coordinates connection setup between peers, then all data flows P2P on local network.
 *
 * Cost: ~$0.001/month per hotel (signaling messages are tiny, ~1KB per connection)
 *
 * Phase 1-2: Cloud signaling (this file)
 * Phase 3: Add local signaling server (desktop app)
 */

import { NextRequest } from 'next/server';

// For Next.js 13+ App Router with WebSocket support
// Note: You'll need to configure this in next.config.js
// or use a separate WebSocket server (e.g., ws package on custom server)

/**
 * IMPORTANT: Next.js API Routes don't natively support WebSockets.
 *
 * Options:
 * 1. Use a custom Next.js server with 'ws' package (recommended for self-hosted)
 * 2. Deploy separate WebSocket server on AWS API Gateway + Lambda (serverless)
 * 3. Use Socket.IO with Next.js custom server
 * 4. Use Vercel's Edge Runtime with WebSockets (limited support)
 *
 * For this example, we'll show the custom server approach.
 * See: lib/webrtc/signaling-server.ts for the implementation
 */

export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({
      error: 'WebSocket upgrade required',
      message: 'This endpoint requires a WebSocket connection',
      instructions: 'Use ws:// or wss:// protocol to connect',
    }),
    {
      status: 426,
      headers: {
        'Content-Type': 'application/json',
        'Upgrade': 'websocket',
      },
    }
  );
}

// Export runtime config to enable WebSockets in Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
