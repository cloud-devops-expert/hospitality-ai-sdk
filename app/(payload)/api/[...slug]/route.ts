/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { NextRequest } from 'next/server'

import config from '@/payload.config'
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'

export const GET = (req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) =>
  REST_GET(req, { config, params })

export const POST = (req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) =>
  REST_POST(req, { config, params })

export const DELETE = (req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) =>
  REST_DELETE(req, { config, params })

export const PATCH = (req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) =>
  REST_PATCH(req, { config, params })
