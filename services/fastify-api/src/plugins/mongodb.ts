import fp from 'fastify-plugin'
import mongoose from 'mongoose'
import { FastifyPluginAsync } from 'fastify'

export interface MongoDBOptions {
  uri?: string
}

/**
 * MongoDB connection plugin using Mongoose
 * 
 * @see https://mongoosejs.com/
 */
const mongodbPlugin: FastifyPluginAsync<MongoDBOptions> = async (fastify, opts) => {
  const uri = opts.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/formily-admin'
  
  try {
    // Set connection timeout and other options
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      connectTimeoutMS: 10000, // 10 seconds timeout
    })
    fastify.log.info('MongoDB connected successfully')
    
    // Add mongoose instance to fastify
    fastify.decorate('mongoose', mongoose)
    
    // Graceful shutdown
    fastify.addHook('onClose', async () => {
      await mongoose.connection.close()
      fastify.log.info('MongoDB connection closed')
    })
  } catch (error) {
    fastify.log.warn('MongoDB connection failed, continuing without database:', error)
    // Don't throw error to allow app to start without MongoDB
    // In production, you might want to throw the error
  }
}

export default fp(mongodbPlugin, {
  name: 'mongodb'
})