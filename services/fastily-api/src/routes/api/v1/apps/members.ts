/**
 * 应用成员管理路由
 */
import { FastifyPluginAsync } from 'fastify'
import { AppService } from '../../../../services/app.service'
import { AppUserRole } from '../../../../models/app'

// 应用成员管理路由
const appMembersRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // 创建应用服务实例
  const appService = new AppService(fastify)

  // 获取应用成员列表
  fastify.get('/:id/members', {
    schema: {
      description: '获取应用成员列表',
      tags: ['app-members'],
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  app_id: { type: 'string' },
                  user_id: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'developer', 'member'] },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' }
                }
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

      // 检查应用是否存在
      const app = await appService.getAppById(id)
      if (!app) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用不存在'
        }
      }

      const members = await appService.getAppUsers(id)

      return {
        success: true,
        code: 200,
        message: '获取应用成员列表成功',
        data: members
      }
    }
  })

  // 添加应用成员
  fastify.post('/:id/members', {
    schema: {
      description: '添加应用成员',
      tags: ['app-members'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '应用ID' }
        }
      },
      body: {
        type: 'object',
        required: ['user_id', 'role'],
        properties: {
          user_id: { type: 'string', description: '用户ID' },
          role: { type: 'string', enum: ['admin', 'developer', 'member'], description: '角色' }
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
                app_id: { type: 'string' },
                user_id: { type: 'string' },
                role: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        400: {
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
      const { user_id, role } = request.body as { user_id: string; role: AppUserRole }

      // 检查应用是否存在
      const app = await appService.getAppById(id)
      if (!app) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用不存在'
        }
      }

      try {
        const member = await appService.addAppUser({
          app_id: id,
          user_id,
          role
        })

        return {
          success: true,
          code: 200,
          message: '添加应用成员成功',
          data: member
        }
      } catch (error: any) {
        reply.code(400)
        return {
          success: false,
          code: 400,
          message: error.message || '添加应用成员失败'
        }
      }
    }
  })

  // 更新应用成员角色
  fastify.put('/:id/members/:userId', {
    schema: {
      description: '更新应用成员角色',
      tags: ['app-members'],
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: {
          id: { type: 'string', description: '应用ID' },
          userId: { type: 'string', description: '用户ID' }
        }
      },
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['admin', 'developer', 'member'], description: '角色' }
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
                app_id: { type: 'string' },
                user_id: { type: 'string' },
                role: { type: 'string' },
                updated_at: { type: 'string', format: 'date-time' }
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
      const { id, userId } = request.params as { id: string; userId: string }
      const { role } = request.body as { role: AppUserRole }

      const member = await appService.updateAppUserRole(id, userId, role)

      if (!member) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用成员不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '更新应用成员角色成功',
        data: member
      }
    }
  })

  // 移除应用成员
  fastify.delete('/:id/members/:userId', {
    schema: {
      description: '移除应用成员',
      tags: ['app-members'],
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: {
          id: { type: 'string', description: '应用ID' },
          userId: { type: 'string', description: '用户ID' }
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
      const { id, userId } = request.params as { id: string; userId: string }

      const result = await appService.removeAppUser(id, userId)

      if (!result) {
        reply.code(404)
        return {
          success: false,
          code: 404,
          message: '应用成员不存在'
        }
      }

      return {
        success: true,
        code: 200,
        message: '移除应用成员成功'
      }
    }
  })
}

export default appMembersRoutes