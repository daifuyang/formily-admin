import { FastifyPluginAsync } from 'fastify'
import { formService } from '../../services/form'

const formStatsRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  
  // 获取表单实例统计信息
  fastify.get<{
    Querystring: { formId?: string }
  }>('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          formId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                draft: { type: 'number' },
                submitted: { type: 'number' },
                approved: { type: 'number' },
                rejected: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async function (request, reply) {
    try {
      const { formId } = request.query
      
      const stats = await formService.getFormInstanceStats(formId)
      
      reply.send({
        success: true,
        data: stats
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })
}

export default formStatsRoutes