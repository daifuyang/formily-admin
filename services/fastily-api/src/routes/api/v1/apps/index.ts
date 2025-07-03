/**
 * 应用管理路由
 */
import { FastifyPluginAsync } from 'fastify'
import { AppService } from '../../../../services/app.service'
import { App } from '../../../../models/app'

// 应用管理路由
const appsRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // 创建应用服务实例
  const appService = new AppService(fastify)

  // 获取应用列表
  fastify.get('/', {
    schema: {
      description: '获取应用列表',
      tags: ['apps'],
      querystring: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '应用名称（模糊搜索）' },
          group_id: { type: 'string', description: '分组ID' },
          status: { type: 'string', enum: ['active', 'archived', 'all'], description: '应用状态' },
          created_by: { type: 'string', description: '创建者ID' },
          page: { type: 'integer', minimum: 1, default: 1, description: '页码' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: '每页数量' },
          sort: { type: 'string', enum: ['created_at', 'updated_at', 'name'], default: 'created_at', description: '排序字段' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: '排序方向' }
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  icon: { type: 'string' },
                  group_id: { type: 'string' },
                  status: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  deleted_at: { type: 'string', format: 'date-time' },
                  created_by: { type: 'string' },
                  updated_by: { type: 'string' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { name, group_id, status, created_by, page, limit, sort, order } = request.query as any
      const result = await appService.getApps({ name, group_id, status, created_by }, page, limit, sort, order)

      return {
        success: true,
        code: 200,
        message: '获取应用列表成功',
        ...result
      }
    }
  })

  // 获取应用详情
  fastify.get('/:id', {
    schema: {
      description: '获取应用详情',
      tags: ['apps'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '应用ID' }
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
                icon: { type: 'string' },
                group_id: { type: 'string' },
                status: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                deleted_at: { type: 'string', format: 'date-time' },
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
      const app = await appService.getAppById(id)

      if (!app) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '获取应用详情成功',
        data: app
      }
    }
  })

  // 创建应用
  fastify.post('/', {
    schema: {
      description: '创建应用',
      tags: ['apps'],
      body: {
        type: 'object',
        required: ['name', 'created_by'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50, description: '应用名称' },
          description: { type: 'string', maxLength: 200, description: '应用描述' },
          icon: { type: 'string', description: '应用图标URL' },
          group_id: { type: 'string', description: '分组ID' },
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
                icon: { type: 'string' },
                group_id: { type: 'string' },
                status: { type: 'string' },
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
      const appData = request.body as Partial<App>
      const app = await appService.createApp(appData)

      return {
        success: true,
        code: 200,
        message: '创建应用成功',
        data: app
      }
    }
  })

  // 更新应用
  fastify.put('/:id', {
    schema: {
      description: '更新应用',
      tags: ['apps'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '应用ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50, description: '应用名称' },
          description: { type: 'string', maxLength: 200, description: '应用描述' },
          icon: { type: 'string', description: '应用图标URL' },
          group_id: { type: 'string', description: '分组ID' },
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
                icon: { type: 'string' },
                group_id: { type: 'string' },
                status: { type: 'string' },
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
      const appData = request.body as Partial<App>

      const app = await appService.updateApp(id, appData)

      if (!app) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '更新应用成功',
        data: app
      }
    }
  })

  // 删除应用
  fastify.delete('/:id', {
    schema: {
      description: '删除应用（软删除）',
      tags: ['apps'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '应用ID' }
        }
      },
      querystring: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'string', description: '操作用户ID' }
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
      const { user_id } = request.query as { user_id: string }

      const app = await appService.deleteApp(id, user_id)

      if (!app) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '删除应用成功'
      }
    }
  })

  // 归档应用
  fastify.post('/:id/archive', {
    schema: {
      description: '归档应用',
      tags: ['apps'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '应用ID' }
        }
      },
      body: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'string', description: '操作用户ID' }
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
                status: { type: 'string' }
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
      const { user_id } = request.body as { user_id: string }

      const app = await appService.archiveApp(id, user_id)

      if (!app) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '归档应用成功',
        data: {
          _id: app._id,
          status: app.status
        }
      }
    }
  })

  // 恢复应用
  fastify.post('/:id/restore', {
    schema: {
      description: '恢复应用',
      tags: ['apps'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '应用ID' }
        }
      },
      body: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'string', description: '操作用户ID' }
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
                status: { type: 'string' }
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
      const { user_id } = request.body as { user_id: string }

      const app = await appService.restoreApp(id, user_id)

      if (!app) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '恢复应用成功',
        data: {
          _id: app._id,
          status: app.status
        }
      }
    }
  })
}

export default appsRoutes