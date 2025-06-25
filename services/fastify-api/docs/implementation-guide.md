# Schema表单系统实现指南

## 项目依赖安装

首先需要安装必要的依赖包：

```bash
npm install mongodb uuid @types/uuid
npm install --save-dev @types/mongodb
```

## 1. 数据库连接插件

创建MongoDB连接插件：

```typescript
// src/plugins/mongodb.ts
import fp from 'fastify-plugin';
import { MongoClient, Db } from 'mongodb';

declare module 'fastify' {
  interface FastifyInstance {
    mongo: {
      client: MongoClient;
      db: Db;
    };
  }
}

export default fp(async function (fastify, opts) {
  const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'formily_admin';
  
  const client = new MongoClient(url);
  await client.connect();
  
  const db = client.db(dbName);
  
  // 创建集合和索引
  await initializeCollections(db);
  
  fastify.decorate('mongo', {
    client,
    db
  });
  
  fastify.addHook('onClose', async (instance) => {
    await instance.mongo.client.close();
  });
});

async function initializeCollections(db: Db) {
  // 创建表单定义集合
  const formDefinitions = db.collection('form_definitions');
  await formDefinitions.createIndex({ formUuid: 1 }, { unique: true });
  await formDefinitions.createIndex({ status: 1 });
  await formDefinitions.createIndex({ createdAt: -1 });
  
  // 创建表单实例集合
  const formInstances = db.collection('form_instances');
  await formInstances.createIndex({ formInstId: 1 }, { unique: true });
  await formInstances.createIndex({ formUuid: 1 });
  await formInstances.createIndex({ originatorId: 1 });
  await formInstances.createIndex({ createdAt: -1 });
  await formInstances.createIndex({ modifiedAt: -1 });
  await formInstances.createIndex({ status: 1 });
  
  // 复合索引用于复杂查询
  await formInstances.createIndex({ formUuid: 1, status: 1, createdAt: -1 });
  await formInstances.createIndex({ formUuid: 1, originatorId: 1 });
}
```

## 2. 类型定义

```typescript
// src/types/form.ts
import { ObjectId } from 'mongodb';
import { ISchema } from '@formily/react';

export interface FormDefinition {
  _id?: ObjectId;
  formUuid: string;
  name: string;
  description?: string;
  schema: ISchema;
  version: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    allowEdit: boolean;
    allowDelete: boolean;
    workflow?: any;
  };
}

export interface FormInstance {
  _id?: ObjectId;
  formInstId: string;
  formUuid: string;
  formDataJson: Record<string, any>;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  originatorId: string;
  originatorName: string;
  createdAt: Date;
  modifiedAt: Date;
  version: string;
  processInstanceId?: string;
}

export interface SaveFormDataRequest {
  formUuid: string;
  formDataJson: Record<string, any>;
  originatorId: string;
  originatorName: string;
}

export interface UpdateFormDataRequest {
  updateFormDataJson: Record<string, any>;
  useLatestVersion?: 'y' | 'n';
}

export interface SearchFormDataRequest {
  formUuid: string;
  searchFieldJson?: string;
  currentPage: number;
  pageSize: number;
  originatorId?: string;
  createFrom?: string;
  createTo?: string;
  modifiedFrom?: string;
  modifiedTo?: string;
  dynamicOrder?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}
```

## 3. 表单服务类

```typescript
// src/services/FormService.ts
import { Db, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import {
  FormDefinition,
  FormInstance,
  SaveFormDataRequest,
  UpdateFormDataRequest,
  SearchFormDataRequest,
  PaginatedResponse
} from '../types/form';

export class FormService {
  constructor(private db: Db) {}

  /**
   * 保存表单数据
   */
  async saveFormData(params: SaveFormDataRequest): Promise<{ formInstId: string }> {
    const { formUuid, formDataJson, originatorId, originatorName } = params;
    
    // 验证表单定义是否存在
    const formDef = await this.db.collection<FormDefinition>('form_definitions')
      .findOne({ formUuid, status: 'active' });
    
    if (!formDef) {
      throw new Error('表单定义不存在或已禁用');
    }

    // 验证表单数据（这里可以添加基于schema的验证）
    await this.validateFormData(formDef.schema, formDataJson);

    // 生成表单实例ID
    const formInstId = `FINST-${uuidv4()}`;
    
    // 创建表单实例
    const formInstance: FormInstance = {
      formInstId,
      formUuid,
      formDataJson,
      status: 'submitted',
      originatorId,
      originatorName,
      createdAt: new Date(),
      modifiedAt: new Date(),
      version: formDef.version
    };

    await this.db.collection<FormInstance>('form_instances').insertOne(formInstance);
    
    return { formInstId };
  }

  /**
   * 更新表单数据
   */
  async updateFormData(
    formInstId: string, 
    updateFormDataJson: Record<string, any>,
    useLatestVersion?: string
  ): Promise<void> {
    const instance = await this.db.collection<FormInstance>('form_instances')
      .findOne({ formInstId });
    
    if (!instance) {
      throw new Error('表单实例不存在');
    }

    // 检查是否允许编辑
    if (instance.status === 'approved') {
      throw new Error('已审批的表单不允许编辑');
    }

    // 如果使用最新版本，需要获取最新的表单定义
    if (useLatestVersion === 'y') {
      const latestFormDef = await this.db.collection<FormDefinition>('form_definitions')
        .findOne({ formUuid: instance.formUuid, status: 'active' });
      
      if (latestFormDef && latestFormDef.version !== instance.version) {
        // 验证新数据是否符合最新schema
        await this.validateFormData(latestFormDef.schema, updateFormDataJson);
      }
    }

    // 合并更新数据
    const updatedData = { ...instance.formDataJson, ...updateFormDataJson };
    
    await this.db.collection<FormInstance>('form_instances').updateOne(
      { formInstId },
      {
        $set: {
          formDataJson: updatedData,
          modifiedAt: new Date(),
          ...(useLatestVersion === 'y' && { status: 'draft' }) // 如果更新到最新版本，状态改为草稿
        }
      }
    );
  }

  /**
   * 根据ID获取表单数据
   */
  async getFormDataById(formInstId: string): Promise<FormInstance> {
    const instance = await this.db.collection<FormInstance>('form_instances')
      .findOne({ formInstId });
    
    if (!instance) {
      throw new Error('表单实例不存在');
    }

    return instance;
  }

  /**
   * 搜索表单数据
   */
  async searchFormDatas(params: SearchFormDataRequest): Promise<PaginatedResponse<FormInstance>> {
    const {
      formUuid,
      searchFieldJson,
      currentPage,
      pageSize,
      originatorId,
      createFrom,
      createTo,
      modifiedFrom,
      modifiedTo,
      dynamicOrder
    } = params;

    // 构建查询条件
    const query: any = { formUuid };
    
    if (originatorId) {
      query.originatorId = originatorId;
    }
    
    // 创建时间范围
    if (createFrom || createTo) {
      query.createdAt = {};
      if (createFrom) query.createdAt.$gte = new Date(createFrom);
      if (createTo) query.createdAt.$lte = new Date(createTo);
    }
    
    // 修改时间范围
    if (modifiedFrom || modifiedTo) {
      query.modifiedAt = {};
      if (modifiedFrom) query.modifiedAt.$gte = new Date(modifiedFrom);
      if (modifiedTo) query.modifiedAt.$lte = new Date(modifiedTo);
    }

    // 处理表单字段搜索
    if (searchFieldJson) {
      try {
        const searchFields = JSON.parse(searchFieldJson);
        Object.keys(searchFields).forEach(key => {
          const value = searchFields[key];
          if (typeof value === 'string') {
            // 字符串类型支持模糊搜索
            query[`formDataJson.${key}`] = { $regex: value, $options: 'i' };
          } else {
            // 其他类型精确匹配
            query[`formDataJson.${key}`] = value;
          }
        });
      } catch (error) {
        throw new Error('搜索条件JSON格式错误');
      }
    }

    // 构建排序
    let sort: any = { createdAt: -1 };
    if (dynamicOrder) {
      try {
        const [field, direction] = dynamicOrder.split(':');
        if (field && direction) {
          sort = { [field]: direction === 'desc' ? -1 : 1 };
        }
      } catch (error) {
        // 排序格式错误时使用默认排序
      }
    }

    // 分页参数验证
    const validatedCurrentPage = Math.max(1, currentPage);
    const validatedPageSize = Math.min(Math.max(1, pageSize), 100); // 限制最大页面大小
    const skip = (validatedCurrentPage - 1) * validatedPageSize;

    // 并行执行查询和计数
    const [data, total] = await Promise.all([
      this.db.collection<FormInstance>('form_instances')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(validatedPageSize)
        .toArray(),
      this.db.collection<FormInstance>('form_instances').countDocuments(query)
    ]);

    return {
      data,
      total,
      currentPage: validatedCurrentPage,
      pageSize: validatedPageSize,
      totalPages: Math.ceil(total / validatedPageSize)
    };
  }

  /**
   * 删除表单数据
   */
  async deleteFormData(formInstId: string): Promise<void> {
    // 先检查表单是否存在
    const instance = await this.db.collection<FormInstance>('form_instances')
      .findOne({ formInstId });
    
    if (!instance) {
      throw new Error('表单实例不存在');
    }

    // 检查是否允许删除
    if (instance.status === 'approved') {
      throw new Error('已审批的表单不允许删除');
    }

    const result = await this.db.collection<FormInstance>('form_instances')
      .deleteOne({ formInstId });
    
    if (result.deletedCount === 0) {
      throw new Error('删除失败');
    }
  }

  /**
   * 获取表单实例ID列表（用于批量操作）
   */
  async searchFormDataIds(params: SearchFormDataRequest): Promise<string[]> {
    const query = await this.buildSearchQuery(params);
    
    const instances = await this.db.collection<FormInstance>('form_instances')
      .find(query, { projection: { formInstId: 1 } })
      .limit(params.pageSize || 100)
      .toArray();
    
    return instances.map(instance => instance.formInstId);
  }

  /**
   * 批量删除表单数据
   */
  async batchDeleteFormData(formInstIds: string[]): Promise<number> {
    const result = await this.db.collection<FormInstance>('form_instances')
      .deleteMany({ 
        formInstId: { $in: formInstIds },
        status: { $ne: 'approved' } // 不删除已审批的数据
      });
    
    return result.deletedCount;
  }

  /**
   * 表单定义管理
   */
  async createFormDefinition(formDef: Omit<FormDefinition, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const existingForm = await this.db.collection<FormDefinition>('form_definitions')
      .findOne({ formUuid: formDef.formUuid });
    
    if (existingForm) {
      throw new Error('表单UUID已存在');
    }

    const newFormDef: FormDefinition = {
      ...formDef,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.db.collection<FormDefinition>('form_definitions').insertOne(newFormDef);
    return formDef.formUuid;
  }

  async getFormDefinition(formUuid: string): Promise<FormDefinition> {
    const formDef = await this.db.collection<FormDefinition>('form_definitions')
      .findOne({ formUuid });
    
    if (!formDef) {
      throw new Error('表单定义不存在');
    }

    return formDef;
  }

  async updateFormDefinition(formUuid: string, updates: Partial<FormDefinition>): Promise<void> {
    const result = await this.db.collection<FormDefinition>('form_definitions')
      .updateOne(
        { formUuid },
        {
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );
    
    if (result.matchedCount === 0) {
      throw new Error('表单定义不存在');
    }
  }

  /**
   * 获取表单组件定义列表
   */
  async getFormComponentDefinition(formUuid: string, version?: string): Promise<any> {
    const query: any = { formUuid, status: 'active' };
    if (version) {
      query.version = version;
    }

    const formDef = await this.db.collection<FormDefinition>('form_definitions')
      .findOne(query);
    
    if (!formDef) {
      throw new Error('表单定义不存在');
    }

    return {
      formUuid: formDef.formUuid,
      version: formDef.version,
      schema: formDef.schema,
      components: this.extractComponentsFromSchema(formDef.schema)
    };
  }

  /**
   * 从Schema中提取组件信息
   */
  private extractComponentsFromSchema(schema: any): any[] {
    const components: any[] = [];
    
    const extractComponents = (obj: any, path: string = '') => {
      if (obj && typeof obj === 'object') {
        if (obj['x-component']) {
          components.push({
            path,
            component: obj['x-component'],
            title: obj.title,
            type: obj.type,
            required: obj['x-validator'] === 'required',
            props: obj['x-component-props'] || {}
          });
        }
        
        if (obj.properties) {
          Object.keys(obj.properties).forEach(key => {
            extractComponents(obj.properties[key], path ? `${path}.${key}` : key);
          });
        }
      }
    };
    
    extractComponents(schema);
    return components;
  }

  /**
   * 验证表单数据
   */
  private async validateFormData(schema: any, data: Record<string, any>): Promise<void> {
    // 这里可以实现基于Formily Schema的数据验证
    // 简单示例：检查必填字段
    const validateRequired = (obj: any, dataObj: any, path: string = '') => {
      if (obj && typeof obj === 'object') {
        if (obj['x-validator'] === 'required') {
          const value = path.split('.').reduce((data, key) => data?.[key], dataObj);
          if (value === undefined || value === null || value === '') {
            throw new Error(`字段 ${obj.title || path} 为必填项`);
          }
        }
        
        if (obj.properties) {
          Object.keys(obj.properties).forEach(key => {
            validateRequired(obj.properties[key], dataObj, path ? `${path}.${key}` : key);
          });
        }
      }
    };
    
    validateRequired(schema, data);
  }

  /**
   * 构建搜索查询条件
   */
  private async buildSearchQuery(params: SearchFormDataRequest): Promise<any> {
    const {
      formUuid,
      searchFieldJson,
      originatorId,
      createFrom,
      createTo,
      modifiedFrom,
      modifiedTo
    } = params;

    const query: any = { formUuid };
    
    if (originatorId) {
      query.originatorId = originatorId;
    }
    
    if (createFrom || createTo) {
      query.createdAt = {};
      if (createFrom) query.createdAt.$gte = new Date(createFrom);
      if (createTo) query.createdAt.$lte = new Date(createTo);
    }
    
    if (modifiedFrom || modifiedTo) {
      query.modifiedAt = {};
      if (modifiedFrom) query.modifiedAt.$gte = new Date(modifiedFrom);
      if (modifiedTo) query.modifiedAt.$lte = new Date(modifiedTo);
    }

    if (searchFieldJson) {
      try {
        const searchFields = JSON.parse(searchFieldJson);
        Object.keys(searchFields).forEach(key => {
          query[`formDataJson.${key}`] = searchFields[key];
        });
      } catch (error) {
        throw new Error('搜索条件JSON格式错误');
      }
    }

    return query;
  }
}
```

## 4. 路由实现

```typescript
// src/routes/form/index.ts
import { FastifyPluginAsync } from 'fastify';
import { FormService } from '../../services/FormService';
import {
  SaveFormDataRequest,
  UpdateFormDataRequest,
  SearchFormDataRequest,
  ApiResponse
} from '../../types/form';

const formRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // 表单数据相关路由
  
  // 保存表单数据
  fastify.post<{
    Body: SaveFormDataRequest;
    Reply: ApiResponse<{ formInstId: string }>;
  }>('/data', {
    schema: {
      body: {
        type: 'object',
        required: ['formUuid', 'formDataJson', 'originatorId', 'originatorName'],
        properties: {
          formUuid: { type: 'string' },
          formDataJson: { type: 'object' },
          originatorId: { type: 'string' },
          originatorName: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    
    try {
      const result = await formService.saveFormData(request.body);
      
      return {
        success: true,
        data: result,
        message: '保存成功'
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        message: error.message,
        code: 'SAVE_FAILED'
      };
    }
  });

  // 更新表单数据
  fastify.put<{
    Params: { formInstId: string };
    Body: UpdateFormDataRequest;
    Reply: ApiResponse;
  }>('/data/:formInstId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          formInstId: { type: 'string' }
        },
        required: ['formInstId']
      },
      body: {
        type: 'object',
        required: ['updateFormDataJson'],
        properties: {
          updateFormDataJson: { type: 'object' },
          useLatestVersion: { type: 'string', enum: ['y', 'n'] }
        }
      }
    }
  }, async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    const { formInstId } = request.params;
    const { updateFormDataJson, useLatestVersion } = request.body;
    
    try {
      await formService.updateFormData(formInstId, updateFormDataJson, useLatestVersion);
      
      return {
        success: true,
        message: '更新成功'
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        message: error.message,
        code: 'UPDATE_FAILED'
      };
    }
  });

  // 获取表单数据
  fastify.get<{
    Params: { formInstId: string };
    Reply: ApiResponse;
  }>('/data/:formInstId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          formInstId: { type: 'string' }
        },
        required: ['formInstId']
      }
    }
  }, async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    const { formInstId } = request.params;
    
    try {
      const data = await formService.getFormDataById(formInstId);
      
      return {
        success: true,
        data,
        message: '获取成功'
      };
    } catch (error) {
      reply.code(404);
      return {
        success: false,
        message: error.message,
        code: 'NOT_FOUND'
      };
    }
  });

  // 搜索表单数据
  fastify.post<{
    Body: SearchFormDataRequest;
    Reply: ApiResponse;
  }>('/data/search', {
    schema: {
      body: {
        type: 'object',
        required: ['formUuid', 'currentPage', 'pageSize'],
        properties: {
          formUuid: { type: 'string' },
          searchFieldJson: { type: 'string' },
          currentPage: { type: 'number', minimum: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100 },
          originatorId: { type: 'string' },
          createFrom: { type: 'string' },
          createTo: { type: 'string' },
          modifiedFrom: { type: 'string' },
          modifiedTo: { type: 'string' },
          dynamicOrder: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    
    try {
      const result = await formService.searchFormDatas(request.body);
      
      return {
        success: true,
        data: result,
        message: '搜索成功'
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        message: error.message,
        code: 'SEARCH_FAILED'
      };
    }
  });

  // 删除表单数据
  fastify.delete<{
    Params: { formInstId: string };
    Reply: ApiResponse;
  }>('/data/:formInstId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          formInstId: { type: 'string' }
        },
        required: ['formInstId']
      }
    }
  }, async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    const { formInstId } = request.params;
    
    try {
      await formService.deleteFormData(formInstId);
      
      return {
        success: true,
        message: '删除成功'
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        message: error.message,
        code: 'DELETE_FAILED'
      };
    }
  });

  // 批量删除表单数据
  fastify.post<{
    Body: { formInstIds: string[] };
    Reply: ApiResponse<{ deletedCount: number }>;
  }>('/data/batch-delete', {
    schema: {
      body: {
        type: 'object',
        required: ['formInstIds'],
        properties: {
          formInstIds: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 100
          }
        }
      }
    }
  }, async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    const { formInstIds } = request.body;
    
    try {
      const deletedCount = await formService.batchDeleteFormData(formInstIds);
      
      return {
        success: true,
        data: { deletedCount },
        message: `成功删除 ${deletedCount} 条记录`
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        message: error.message,
        code: 'BATCH_DELETE_FAILED'
      };
    }
  });

  // 表单定义相关路由
  
  // 创建表单定义
  fastify.post('/definition', async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    
    try {
      const formUuid = await formService.createFormDefinition(request.body as any);
      
      return {
        success: true,
        data: { formUuid },
        message: '创建成功'
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        message: error.message,
        code: 'CREATE_DEFINITION_FAILED'
      };
    }
  });

  // 获取表单定义
  fastify.get<{
    Params: { formUuid: string };
  }>('/definition/:formUuid', async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    const { formUuid } = request.params;
    
    try {
      const data = await formService.getFormDefinition(formUuid);
      
      return {
        success: true,
        data,
        message: '获取成功'
      };
    } catch (error) {
      reply.code(404);
      return {
        success: false,
        message: error.message,
        code: 'DEFINITION_NOT_FOUND'
      };
    }
  });

  // 获取表单组件定义
  fastify.get<{
    Params: { formUuid: string };
    Querystring: { version?: string };
  }>('/definition/:formUuid/components', async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    const { formUuid } = request.params;
    const { version } = request.query;
    
    try {
      const data = await formService.getFormComponentDefinition(formUuid, version);
      
      return {
        success: true,
        data,
        message: '获取成功'
      };
    } catch (error) {
      reply.code(404);
      return {
        success: false,
        message: error.message,
        code: 'COMPONENTS_NOT_FOUND'
      };
    }
  });

  // 更新表单定义
  fastify.put<{
    Params: { formUuid: string };
  }>('/definition/:formUuid', async (request, reply) => {
    const formService = new FormService(fastify.mongo.db);
    const { formUuid } = request.params;
    
    try {
      await formService.updateFormDefinition(formUuid, request.body as any);
      
      return {
        success: true,
        message: '更新成功'
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        message: error.message,
        code: 'UPDATE_DEFINITION_FAILED'
      };
    }
  });
};

export default formRoutes;
```

## 5. 环境配置

```bash
# .env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=formily_admin
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

## 6. 启动脚本更新

更新 `package.json`：

```json
{
  "scripts": {
    "test": "npm run build:ts && tsc -p test/tsconfig.json && c8 node --test -r ts-node/register \"test/**/*.ts\"",
    "start": "npm run build:ts && fastify start -l info dist/app.js",
    "build:ts": "tsc",
    "watch:ts": "tsc -w",
    "dev": "npm run build:ts && concurrently -k -p \"[{name}]\" -n \"TypeScript,App\" -c \"yellow.bold,cyan.bold\" \"npm:watch:ts\" \"npm:dev:start\"",
    "dev:start": "fastify start --ignore-watch=.ts$ -w -l info -P dist/app.js",
    "seed": "node dist/scripts/seed.js"
  },
  "dependencies": {
    "fastify": "^5.0.0",
    "fastify-plugin": "^5.0.0",
    "@fastify/autoload": "^6.0.0",
    "@fastify/sensible": "^6.0.0",
    "fastify-cli": "^7.4.0",
    "mongodb": "^6.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.1.0",
    "@types/mongodb": "^4.0.7",
    "@types/uuid": "^9.0.0",
    "c8": "^10.1.2",
    "ts-node": "^10.4.0",
    "concurrently": "^9.0.0",
    "fastify-tsconfig": "^3.0.0",
    "typescript": "~5.8.2"
  }
}
```

## 7. 数据库初始化脚本

```typescript
// src/scripts/seed.ts
import { MongoClient } from 'mongodb';
import { FormDefinition } from '../types/form';

async function seedDatabase() {
  const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB || 'formily_admin');
  
  // 创建示例表单定义
  const sampleFormDefinition: FormDefinition = {
    formUuid: 'FORM-USER-INFO',
    name: '用户信息表单',
    description: '用户基本信息收集表单',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: '姓名',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': 'required'
        },
        email: {
          type: 'string',
          title: '邮箱',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': 'email'
        },
        phone: {
          type: 'string',
          title: '手机号',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': 'phone'
        },
        gender: {
          type: 'string',
          title: '性别',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' }
          ]
        },
        birthday: {
          type: 'string',
          title: '生日',
          'x-decorator': 'FormItem',
          'x-component': 'DatePicker'
        },
        address: {
          type: 'object',
          title: '地址信息',
          'x-decorator': 'FormItem',
          properties: {
            province: {
              type: 'string',
              title: '省份',
              'x-decorator': 'FormItem',
              'x-component': 'Select'
            },
            city: {
              type: 'string',
              title: '城市',
              'x-decorator': 'FormItem',
              'x-component': 'Select'
            },
            detail: {
              type: 'string',
              title: '详细地址',
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea'
            }
          }
        }
      }
    },
    version: '1.0.0',
    status: 'active',
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      allowEdit: true,
      allowDelete: true
    }
  };
  
  await db.collection('form_definitions').insertOne(sampleFormDefinition);
  
  console.log('数据库初始化完成');
  await client.close();
}

seedDatabase().catch(console.error);
```

## 8. 使用示例

### 前端调用示例

```typescript
// 前端API调用示例
class FormAPI {
  private baseURL = '/api/form';

  async saveFormData(data: {
    formUuid: string;
    formDataJson: Record<string, any>;
    originatorId: string;
    originatorName: string;
  }) {
    const response = await fetch(`${this.baseURL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async updateFormData(formInstId: string, data: {
    updateFormDataJson: Record<string, any>;
    useLatestVersion?: 'y' | 'n';
  }) {
    const response = await fetch(`${this.baseURL}/data/${formInstId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getFormData(formInstId: string) {
    const response = await fetch(`${this.baseURL}/data/${formInstId}`);
    return response.json();
  }

  async searchFormData(params: {
    formUuid: string;
    currentPage: number;
    pageSize: number;
    searchFieldJson?: string;
    originatorId?: string;
    createFrom?: string;
    createTo?: string;
  }) {
    const response = await fetch(`${this.baseURL}/data/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }

  async deleteFormData(formInstId: string) {
    const response = await fetch(`${this.baseURL}/data/${formInstId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async getFormDefinition(formUuid: string) {
    const response = await fetch(`${this.baseURL}/definition/${formUuid}`);
    return response.json();
  }
}

// 使用示例
const formAPI = new FormAPI();

// 保存表单数据
const saveResult = await formAPI.saveFormData({
  formUuid: 'FORM-USER-INFO',
  formDataJson: {
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    gender: 'male',
    birthday: '1990-01-01',
    address: {
      province: '北京市',
      city: '北京市',
      detail: '朝阳区某某街道'
    }
  },
  originatorId: 'user123',
  originatorName: '张三'
});

console.log('保存结果:', saveResult);
```

## 9. 部署说明

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **配置环境变量**：
   创建 `.env` 文件并配置MongoDB连接信息

3. **构建项目**：
   ```bash
   npm run build:ts
   ```

4. **初始化数据库**：
   ```bash
   npm run seed
   ```

5. **启动服务**：
   ```bash
   npm start
   ```

6. **开发模式**：
   ```bash
   npm run dev
   ```

## 10. 测试

可以使用以下curl命令测试API：

```bash
# 保存表单数据
curl -X POST http://localhost:3000/api/form/data \
  -H "Content-Type: application/json" \
  -d '{
    "formUuid": "FORM-USER-INFO",
    "formDataJson": {
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "originatorId": "user123",
    "originatorName": "张三"
  }'

# 搜索表单数据
curl -X POST http://localhost:3000/api/form/data/search \
  -H "Content-Type: application/json" \
  -d '{
    "formUuid": "FORM-USER-INFO",
    "currentPage": 1,
    "pageSize": 10
  }'
```

这个实现提供了完整的基于Schema的动态表单增删改查功能，支持复杂的查询条件和数据验证，可以满足大多数企业级应用的需求。