# 基于Schema的通用动态表单增删改查后台实现

## 概述

本文档描述了一个基于Formily Schema的通用动态表单系统的后台实现方案，支持表单的增删改查操作，使用MongoDB作为数据存储，Fastify作为Web框架。

## 系统架构

### 前端架构
- **表单渲染**: 基于 `@formily/react` 和 `@formily/antd-v5` 的SchemaForm组件
- **Schema驱动**: 通过JSON Schema定义表单结构和验证规则
- **组件支持**: 支持所有Formily Antd-v5组件（输入控件、布局组件、场景组件等）

### 后端架构
- **Web框架**: Fastify
- **数据库**: MongoDB
- **API设计**: RESTful API，参考钉钉宜搭表单数据API规范

## 数据模型设计

### 表单定义模型 (FormDefinition)

```typescript
interface FormDefinition {
  _id: ObjectId;                    // 表单定义ID
  formUuid: string;                 // 表单唯一标识
  name: string;                     // 表单名称
  description?: string;             // 表单描述
  schema: ISchema;                  // Formily Schema定义
  version: string;                  // 表单版本
  status: 'active' | 'inactive';   // 表单状态
  createdBy: string;                // 创建人
  createdAt: Date;                  // 创建时间
  updatedAt: Date;                  // 更新时间
  settings?: {
    allowEdit: boolean;             // 是否允许编辑
    allowDelete: boolean;           // 是否允许删除
    workflow?: any;                 // 工作流配置
  };
}
```

### 表单实例模型 (FormInstance)

```typescript
interface FormInstance {
  _id: ObjectId;                    // 实例ID
  formInstId: string;               // 表单实例唯一标识
  formUuid: string;                 // 关联的表单定义UUID
  formDataJson: Record<string, any>; // 表单数据JSON
  status: 'draft' | 'submitted' | 'approved' | 'rejected'; // 实例状态
  originatorId: string;             // 提交人ID
  originatorName: string;           // 提交人姓名
  createdAt: Date;                  // 创建时间
  modifiedAt: Date;                 // 修改时间
  version: string;                  // 表单版本
  processInstanceId?: string;       // 流程实例ID（如果有工作流）
}
```

## API接口设计

### 1. 保存表单数据 (Create)

**接口路径**: `POST /api/form/data`

**请求参数**:
```typescript
interface SaveFormDataRequest {
  formUuid: string;                 // 表单UUID
  formDataJson: Record<string, any>; // 表单数据
  originatorId: string;             // 提交人ID
  originatorName: string;           // 提交人姓名
}
```

**响应数据**:
```typescript
interface SaveFormDataResponse {
  success: boolean;
  data: {
    formInstId: string;             // 生成的表单实例ID
  };
  message: string;
}
```

### 2. 更新表单数据 (Update)

**接口路径**: `PUT /api/form/data/:formInstId`

**请求参数**:
```typescript
interface UpdateFormDataRequest {
  updateFormDataJson: Record<string, any>; // 要更新的表单数据
  useLatestVersion?: 'y' | 'n';     // 是否使用最新版本
}
```

### 3. 根据ID获取表单数据 (Read)

**接口路径**: `GET /api/form/data/:formInstId`

**响应数据**:
```typescript
interface GetFormDataResponse {
  success: boolean;
  data: FormInstance;
  message: string;
}
```

### 4. 搜索表单数据 (Search)

**接口路径**: `POST /api/form/data/search`

**请求参数**:
```typescript
interface SearchFormDataRequest {
  formUuid: string;                 // 表单UUID
  searchFieldJson?: string;         // 搜索条件JSON字符串
  currentPage: number;              // 当前页码
  pageSize: number;                 // 每页大小
  originatorId?: string;            // 提交人ID筛选
  createFrom?: string;              // 创建时间起始
  createTo?: string;                // 创建时间结束
  modifiedFrom?: string;            // 修改时间起始
  modifiedTo?: string;              // 修改时间结束
  dynamicOrder?: string;            // 排序规则
}
```

### 5. 删除表单数据 (Delete)

**接口路径**: `DELETE /api/form/data/:formInstId`

### 6. 表单定义管理

**创建表单定义**: `POST /api/form/definition`
**更新表单定义**: `PUT /api/form/definition/:formUuid`
**获取表单定义**: `GET /api/form/definition/:formUuid`
**获取表单组件定义**: `GET /api/form/definition/:formUuid/components`

## 实现细节

### MongoDB集合设计

```javascript
// 表单定义集合
db.createCollection("form_definitions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["formUuid", "name", "schema", "version", "status"],
      properties: {
        formUuid: { bsonType: "string" },
        name: { bsonType: "string" },
        schema: { bsonType: "object" },
        version: { bsonType: "string" },
        status: { enum: ["active", "inactive"] }
      }
    }
  }
});

// 表单实例集合
db.createCollection("form_instances", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["formInstId", "formUuid", "formDataJson", "originatorId"],
      properties: {
        formInstId: { bsonType: "string" },
        formUuid: { bsonType: "string" },
        formDataJson: { bsonType: "object" },
        originatorId: { bsonType: "string" }
      }
    }
  }
});

// 创建索引
db.form_definitions.createIndex({ "formUuid": 1 }, { unique: true });
db.form_instances.createIndex({ "formInstId": 1 }, { unique: true });
db.form_instances.createIndex({ "formUuid": 1 });
db.form_instances.createIndex({ "originatorId": 1 });
db.form_instances.createIndex({ "createdAt": -1 });
```

### Fastify路由实现示例

```typescript
// routes/form/index.ts
import { FastifyPluginAsync } from 'fastify';
import { FormService } from '../../services/FormService';

const formRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const formService = new FormService(fastify.mongo);

  // 保存表单数据
  fastify.post('/data', async (request, reply) => {
    const { formUuid, formDataJson, originatorId, originatorName } = request.body as any;
    
    try {
      const result = await formService.saveFormData({
        formUuid,
        formDataJson,
        originatorId,
        originatorName
      });
      
      return { success: true, data: result, message: '保存成功' };
    } catch (error) {
      reply.code(500);
      return { success: false, message: error.message };
    }
  });

  // 更新表单数据
  fastify.put('/data/:formInstId', async (request, reply) => {
    const { formInstId } = request.params as any;
    const { updateFormDataJson, useLatestVersion } = request.body as any;
    
    try {
      await formService.updateFormData(formInstId, updateFormDataJson, useLatestVersion);
      return { success: true, message: '更新成功' };
    } catch (error) {
      reply.code(500);
      return { success: false, message: error.message };
    }
  });

  // 获取表单数据
  fastify.get('/data/:formInstId', async (request, reply) => {
    const { formInstId } = request.params as any;
    
    try {
      const data = await formService.getFormDataById(formInstId);
      return { success: true, data, message: '获取成功' };
    } catch (error) {
      reply.code(404);
      return { success: false, message: '数据不存在' };
    }
  });

  // 搜索表单数据
  fastify.post('/data/search', async (request, reply) => {
    const searchParams = request.body as any;
    
    try {
      const result = await formService.searchFormDatas(searchParams);
      return { success: true, data: result, message: '搜索成功' };
    } catch (error) {
      reply.code(500);
      return { success: false, message: error.message };
    }
  });

  // 删除表单数据
  fastify.delete('/data/:formInstId', async (request, reply) => {
    const { formInstId } = request.params as any;
    
    try {
      await formService.deleteFormData(formInstId);
      return { success: true, message: '删除成功' };
    } catch (error) {
      reply.code(500);
      return { success: false, message: error.message };
    }
  });
};

export default formRoutes;
```

### 服务层实现示例

```typescript
// services/FormService.ts
import { MongoClient, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export class FormService {
  constructor(private mongo: any) {}

  async saveFormData(params: {
    formUuid: string;
    formDataJson: Record<string, any>;
    originatorId: string;
    originatorName: string;
  }) {
    const { formUuid, formDataJson, originatorId, originatorName } = params;
    
    // 验证表单定义是否存在
    const formDef = await this.mongo.db.collection('form_definitions')
      .findOne({ formUuid, status: 'active' });
    
    if (!formDef) {
      throw new Error('表单定义不存在或已禁用');
    }

    // 生成表单实例ID
    const formInstId = `FINST-${uuidv4()}`;
    
    // 创建表单实例
    const formInstance = {
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

    await this.mongo.db.collection('form_instances').insertOne(formInstance);
    
    return { formInstId };
  }

  async updateFormData(
    formInstId: string, 
    updateFormDataJson: Record<string, any>,
    useLatestVersion?: string
  ) {
    const instance = await this.mongo.db.collection('form_instances')
      .findOne({ formInstId });
    
    if (!instance) {
      throw new Error('表单实例不存在');
    }

    // 合并更新数据
    const updatedData = { ...instance.formDataJson, ...updateFormDataJson };
    
    await this.mongo.db.collection('form_instances').updateOne(
      { formInstId },
      {
        $set: {
          formDataJson: updatedData,
          modifiedAt: new Date()
        }
      }
    );
  }

  async getFormDataById(formInstId: string) {
    const instance = await this.mongo.db.collection('form_instances')
      .findOne({ formInstId });
    
    if (!instance) {
      throw new Error('表单实例不存在');
    }

    return instance;
  }

  async searchFormDatas(params: {
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
  }) {
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

    // 处理表单字段搜索
    if (searchFieldJson) {
      const searchFields = JSON.parse(searchFieldJson);
      Object.keys(searchFields).forEach(key => {
        query[`formDataJson.${key}`] = searchFields[key];
      });
    }

    // 构建排序
    let sort: any = { createdAt: -1 };
    if (dynamicOrder) {
      // 解析排序规则
      const [field, direction] = dynamicOrder.split(':');
      sort = { [field]: direction === 'desc' ? -1 : 1 };
    }

    // 分页查询
    const skip = (currentPage - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.mongo.db.collection('form_instances')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      this.mongo.db.collection('form_instances').countDocuments(query)
    ]);

    return {
      data,
      total,
      currentPage,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async deleteFormData(formInstId: string) {
    const result = await this.mongo.db.collection('form_instances')
      .deleteOne({ formInstId });
    
    if (result.deletedCount === 0) {
      throw new Error('表单实例不存在');
    }
  }
}
```

## 前端集成示例

```typescript
// 使用SchemaForm组件
import React from 'react';
import SchemaForm from '@/components/SchemaForm/SchemaForm';
import { ISchema } from '@formily/react';

const FormPage: React.FC = () => {
  const schema: ISchema = {
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
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/form/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formUuid: 'FORM-USER-INFO',
          formDataJson: values,
          originatorId: 'user123',
          originatorName: '张三'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('保存成功:', result.data.formInstId);
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  return (
    <SchemaForm
      schema={schema}
      onSubmit={handleSubmit}
    />
  );
};
```

## 部署配置

### MongoDB连接配置

```typescript
// plugins/mongodb.ts
import fp from 'fastify-plugin';
import { MongoClient } from 'mongodb';

export default fp(async function (fastify, opts) {
  const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
  await client.connect();
  
  fastify.decorate('mongo', {
    client,
    db: client.db(process.env.MONGODB_DB || 'formily_admin')
  });
  
  fastify.addHook('onClose', async (instance) => {
    await instance.mongo.client.close();
  });
});
```

### 环境变量配置

```bash
# .env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=formily_admin
PORT=3000
HOST=0.0.0.0
```

## 安全考虑

1. **数据验证**: 使用Formily Schema进行前后端数据验证
2. **权限控制**: 基于用户角色的表单访问控制
3. **数据加密**: 敏感字段数据加密存储
4. **审计日志**: 记录所有数据变更操作
5. **防注入**: MongoDB查询参数化，防止NoSQL注入

## 性能优化

1. **索引优化**: 为常用查询字段创建复合索引
2. **分页查询**: 大数据量时使用游标分页
3. **缓存策略**: 表单定义缓存，减少数据库查询
4. **连接池**: MongoDB连接池配置
5. **数据压缩**: 大型表单数据压缩存储

## 扩展功能

1. **工作流集成**: 支持表单审批流程
2. **文件上传**: 支持附件上传和管理
3. **数据导出**: 支持Excel、PDF等格式导出
4. **统计分析**: 表单数据统计和图表展示
5. **版本管理**: 表单定义版本控制和回滚
6. **多租户**: 支持多组织隔离

## 总结

本方案提供了一个完整的基于Schema的动态表单系统实现，具有以下特点：

- **灵活性**: 通过JSON Schema动态定义表单结构
- **可扩展性**: 支持自定义组件和验证规则
- **高性能**: MongoDB存储，支持复杂查询和大数据量
- **易维护**: 清晰的分层架构，便于扩展和维护
- **标准化**: 参考钉钉宜搭API规范，保证接口一致性

该方案可以满足大多数企业级表单应用的需求，并为后续功能扩展提供了良好的基础架构。