import { FastifyPluginAsync } from 'fastify'
import fastifyEnv from '@fastify/env'
import fastifyPlugin from 'fastify-plugin'

// 定义环境变量的schema
const schema = {
  type: 'object',
  required: ['PORT', 'NODE_ENV', 'MONGODB_URL'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    MONGODB_URL: {
      type: 'string'
    }
  }
}

// 配置选项
const options = {
  confKey: 'config', // 默认为 'config'
  schema: schema,
  dotenv: true // 将读取根目录中的.env文件
}

// 使用fastify-plugin包装插件，这样其他插件可以访问装饰器
const envPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyEnv, options)
  
  // 添加一个日志，显示环境变量已加载
  fastify.log.info('环境变量已加载')
}

export default fastifyPlugin(envPlugin)