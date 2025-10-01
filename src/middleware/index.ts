// src/middleware/index.ts
// Register all middleware

import { sequence } from 'astro:middleware'
import { onRequest as authMiddleware } from './auth'

export const onRequest = sequence(authMiddleware)
