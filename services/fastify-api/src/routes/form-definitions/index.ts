import { FastifyPluginAsync } from 'fastify'
import { formService } from '../../services/form'
import {
  CreateFormDefinitionRequest,
  UpdateFormDefinitionRequest
} from '../../types/form'

const formDefinitionsRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  
  // 创建表单定义
  fastify.post<{
    Body: CreateFormDefinitionRequest
  }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['formId', 'name', 'schema'],
        properties: {
          formId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          schema: {
            type: 'object',
            required: ['properties'],
            properties: {
              type: { type: 'string', default: 'object' },
              properties: { type: 'object' }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async function (request, reply) {
    try {
      // TODO: 从认证中获取用户ID，这里暂时使用固定值
      const createdBy = 'system'
      
      const formDefinition = await formService.createFormDefinition(request.body, createdBy)
      
      reply.code(201).send({
        success: true,
        data: formDefinition
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
  
  // 获取表单定义列表
  fastify.get<{
    Querystring: {
      page?: number
      pageSize?: number
      status?: string
    }
  }>('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] }
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
                data: { type: 'array' },
                total: { type: 'number' },
                page: { type: 'number' },
                pageSize: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async function (request, reply) {
    try {
      const { page = 1, pageSize = 20, status } = request.query
      
      const result = await formService.getFormDefinitions(page, pageSize, status)
      
      reply.send({
        success: true,
        data: result
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })
  
  // 根据formId获取表单定义
  fastify.get<{
    Params: { formId: string }
  }>('/:formId', {
    schema: {
      params: {
        type: 'object',
        required: ['formId'],
        properties: {
          formId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async function (request, reply) {
    try {
      const { formId } = request.params
      
      const formDefinition = await formService.getFormDefinition(formId)
      
      if (!formDefinition) {
        reply.code(404).send({
          success: false,
          error: 'Form definition not found'
        })
        return
      }
      
      reply.send({
        success: true,
        data: formDefinition
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })
  
  // 更新表单定义
  fastify.put<{
    Params: { formId: string }
    Body: UpdateFormDefinitionRequest
  }>('/:formId', {
    schema: {
      params: {
        type: 'object',
        required: ['formId'],
        properties: {
          formId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          schema: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              properties: { type: 'object' }
            }
          },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async function (request, reply) {
    try {
      const { formId } = request.params
      
      const formDefinition = await formService.updateFormDefinition(formId, request.body)
      
      if (!formDefinition) {
        reply.code(404).send({
          success: false,
          error: 'Form definition not found'
        })
        return
      }
      
      reply.send({
        success: true,
        data: formDefinition
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
  
  // 删除表单定义（软删除）
  fastify.delete<{
    Params: { formId: string }
  }>('/:formId', {
    schema: {
      params: {
        type: 'object',
        required: ['formId'],
        properties: {
          formId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async function (request, reply) {
    try {
      const { formId } = request.params
      
      const deleted = await formService.deleteFormDefinition(formId)
      
      if (!deleted) {
        reply.code(404).send({
          success: false,
          error: 'Form definition not found'
        })
        return
      }
      
      reply.send({
        success: true,
        message: 'Form definition deleted successfully'
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

export default formDefinitionsRoutes