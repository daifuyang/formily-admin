import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyMongodb from '@fastify/mongodb'

// 扩展FastifyInstance类型，添加config属性
interface FastifyInstanceWithConfig extends FastifyInstance {
  config?: {
    PORT?: string | number;
    NODE_ENV?: string;
    MONGODB_URL?: string;
  };
}

// 使用fastify-plugin包装插件，这样其他插件可以访问装饰器
const mongodbPlugin: FastifyPluginAsync = async (fastify, opts) => {
  const instance = fastify as FastifyInstanceWithConfig;
  
  // 确保环境变量已加载
  if (!instance.config || !instance.config.MONGODB_URL) {
    throw new Error('MongoDB URL not found in environment variables')
  }

  // 注册MongoDB插件
  await fastify.register(fastifyMongodb, {
    forceClose: true,
    url: instance.config.MONGODB_URL
  })

  fastify.log.info('MongoDB 连接已建立')
}

// 使用fastify-plugin导出插件，这样其他插件可以访问装饰器
export default fastifyPlugin(mongodbPlugin)

// 扩展FastifyInstance类型，添加mongo属性
declare module 'fastify' {
  interface FastifyInstance {
    mongo: import('@fastify/mongodb').FastifyMongoObject & import('@fastify/mongodb').FastifyMongoNestedObject;
  }
}