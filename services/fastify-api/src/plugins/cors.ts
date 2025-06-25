import fp from 'fastify-plugin'
import cors, { FastifyCorsOptions } from '@fastify/cors'

/**
 * CORS plugin for handling cross-origin requests
 * 
 * @see https://github.com/fastify/fastify-cors
 */
const corsPlugin = fp<FastifyCorsOptions>(async (fastify, opts) => {
  const corsOptions: FastifyCorsOptions = {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    ...opts
  }
  
  await fastify.register(cors, corsOptions)
})

export default corsPlugin