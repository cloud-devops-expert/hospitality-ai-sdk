/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { NextRequest } from 'next/server'

import config from '@/payload.config'
import { GraphQLHandler } from '@payloadcms/next/graphql'

export const GET = (req: NextRequest) => GraphQLHandler(req, { config })

export const POST = (req: NextRequest) => GraphQLHandler(req, { config })
