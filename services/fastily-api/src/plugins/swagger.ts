import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

// 扩展FastifyInstance类型，添加config属性
interface FastifyInstanceWithConfig extends FastifyInstance {
  config?: {
    PORT?: string | number;
    NODE_ENV?: string;
    MONGODB_URL?: string;
  };
}

const swaggerPlugin: FastifyPluginAsync = async (fastify, opts) => {
  // 注册 Swagger 插件
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Formily Admin API',
        description: 'Formily Admin API documentation',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${(fastify as FastifyInstanceWithConfig).config?.PORT || 3000}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'apiKey',
            in: 'header'
          }
        }
      },
      tags: []
    }
  })

  // 注册 Swagger UI 插件
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  })

  fastify.log.info('Swagger 文档已配置，访问路径: /documentation')
}

export default fastifyPlugin(swaggerPlugin)