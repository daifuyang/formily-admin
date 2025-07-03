import { FastifyPluginAsync } from 'fastify'

// /api/v1/test
const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/test', async function (request, reply) {
    return { root: true }
  })
}

export default root
