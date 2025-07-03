/**
 * 应用分组管理路由
 */
import { FastifyPluginAsync } from 'fastify'
import { AppService } from '../../../../services/app.service'
import { AppGroup } from '../../../../models/app'

// 应用分组管理路由
const appGroupsRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // 创建应用服务实例
  const appService = new AppService(fastify)

  // 获取应用分组列表
  fastify.get('/', {
    schema: {
      description: '获取应用分组列表',
      tags: ['app-groups'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  created_by: { type: 'string' },
                  updated_by: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const groups = await appService.getAppGroups()

      return {
        success: true,
        code: 200,
        message: '获取应用分组列表成功',
        data: groups
      }
    }
  })

  // 创建应用分组
  fastify.post('/', {
    schema: {
      description: '创建应用分组',
      tags: ['app-groups'],
      body: {
        type: 'object',
        required: ['name', 'created_by'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50, description: '分组名称' },
          description: { type: 'string', maxLength: 200, description: '分组描述' },
          created_by: { type: 'string', description: '创建者ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                created_by: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const groupData = request.body as Partial<AppGroup>
      const group = await appService.createAppGroup(groupData)

      return {
        success: true,
        code: 200,
        message: '创建应用分组成功',
        data: group
      }
    }
  })

  // 更新应用分组
  fastify.put('/:id', {
    schema: {
      description: '更新应用分组',
      tags: ['app-groups'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '分组ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50, description: '分组名称' },
          description: { type: 'string', maxLength: 200, description: '分组描述' },
          updated_by: { type: 'string', description: '更新者ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                created_by: { type: 'string' },
                updated_by: { type: 'string' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const groupData = request.body as Partial<AppGroup>

      const group = await appService.updateAppGroup(id, groupData)

      if (!group) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用分组不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '更新应用分组成功',
        data: group
      }
    }
  })

  // 删除应用分组
  fastify.delete('/:id', {
    schema: {
      description: '删除应用分组',
      tags: ['app-groups'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '分组ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }

      const result = await appService.deleteAppGroup(id)

      if (!result) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用分组不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '删除应用分组成功'
      }
    }
  })
}

export default appGroupsRoutes