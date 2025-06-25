import { FastifyPluginAsync } from 'fastify'
import { formService } from '../../services/form'
import {
  CreateFormInstanceRequest,
  UpdateFormInstanceRequest,
  SearchFormInstancesRequest
} from '../../types/form'

const formInstancesRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  
  // 创建表单实例
  fastify.post<{
    Body: CreateFormInstanceRequest
  }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['formId', 'data'],
        properties: {
          formId: { type: 'string' },
          data: { type: 'object' }
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
      const submittedBy = 'system'
      
      const formInstance = await formService.createFormInstance(request.body, submittedBy)
      
      reply.code(201).send({
        success: true,
        data: formInstance
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
  
  // 搜索表单实例
  fastify.get<{
    Querystring: SearchFormInstancesRequest
  }>('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          formId: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] },
          submittedBy: { type: 'string' },
          dateRangeStart: { type: 'string', format: 'date' },
          dateRangeEnd: { type: 'string', format: 'date' },
          page: { type: 'number', minimum: 1, default: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          sortBy: { type: 'string', default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
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
      const query = request.query
      
      // 处理日期范围
      const searchParams: SearchFormInstancesRequest = {
        formId: query.formId,
        status: query.status,
        submittedBy: query.submittedBy,
        page: query.page,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      }
      
      if (query.dateRangeStart && query.dateRangeEnd) {
        searchParams.dateRange = {
          start: query.dateRangeStart,
          end: query.dateRangeEnd
        }
      }
      
      const result = await formService.searchFormInstances(searchParams)
      
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
  
  // 根据instanceId获取表单实例
  fastify.get<{
    Params: { instanceId: string }
  }>('/:instanceId', {
    schema: {
      params: {
        type: 'object',
        required: ['instanceId'],
        properties: {
          instanceId: { type: 'string' }
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
      const { instanceId } = request.params
      
      const formInstance = await formService.getFormInstance(instanceId)
      
      if (!formInstance) {
        reply.code(404).send({
          success: false,
          error: 'Form instance not found'
        })
        return
      }
      
      reply.send({
        success: true,
        data: formInstance
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })
  
  // 更新表单实例
  fastify.put<{
    Params: { instanceId: string }
    Body: UpdateFormInstanceRequest
  }>('/:instanceId', {
    schema: {
      params: {
        type: 'object',
        required: ['instanceId'],
        properties: {
          instanceId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          data: { type: 'object' },
          status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] }
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
      const { instanceId } = request.params
      
      const formInstance = await formService.updateFormInstance(instanceId, request.body)
      
      if (!formInstance) {
        reply.code(404).send({
          success: false,
          error: 'Form instance not found'
        })
        return
      }
      
      reply.send({
        success: true,
        data: formInstance
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
  
  // 删除表单实例
  fastify.delete<{
    Params: { instanceId: string }
  }>('/:instanceId', {
    schema: {
      params: {
        type: 'object',
        required: ['instanceId'],
        properties: {
          instanceId: { type: 'string' }
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
      const { instanceId } = request.params
      
      const deleted = await formService.deleteFormInstance(instanceId)
      
      if (!deleted) {
        reply.code(404).send({
          success: false,
          error: 'Form instance not found'
        })
        return
      }
      
      reply.send({
        success: true,
        message: 'Form instance deleted successfully'
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

export default formInstancesRoutes