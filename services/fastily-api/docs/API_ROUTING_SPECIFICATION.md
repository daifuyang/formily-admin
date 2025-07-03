# 企业级 API 路由规范

## 目录

- [概述](#概述)
- [基础原则](#基础原则)
- [路由结构](#路由结构)
- [版本控制](#版本控制)
- [HTTP 方法规范](#http-方法规范)
- [资源命名规范](#资源命名规范)
- [查询参数规范](#查询参数规范)
- [响应格式规范](#响应格式规范)
- [错误处理规范](#错误处理规范)
- [认证与授权](#认证与授权)
- [限流与缓存](#限流与缓存)
- [文档与测试](#文档与测试)
- [示例](#示例)

## 概述

本文档定义了企业级 API 的路由设计规范，旨在确保 API 的一致性、可维护性和可扩展性。所有 API 开发都应遵循此规范。

## 基础原则

### 1. RESTful 设计
- 使用 HTTP 动词表示操作
- 使用名词表示资源
- 保持无状态性
- 统一接口设计

### 2. 一致性
- 命名规范统一
- 响应格式统一
- 错误处理统一
- 文档格式统一

### 3. 可预测性
- 路由结构清晰
- 参数命名直观
- 响应格式固定
- 错误信息明确

## 路由结构

### 基础结构
```
{protocol}://{domain}/{api_prefix}/{version}/{resource}
```

### 示例
```
https://api.example.com/api/v1/users
https://api.example.com/api/v1/users/123
https://api.example.com/api/v1/users/123/orders
```

### 组件说明
- `protocol`: https（生产环境必须使用 HTTPS）
- `domain`: API 域名
- `api_prefix`: API 前缀，通常为 `api`
- `version`: API 版本，如 `v1`, `v2`
- `resource`: 资源路径

## 版本控制

### 版本策略
- 使用 URL 路径版本控制：`/api/v1/`
- 版本号采用语义化版本控制
- 主版本号变更表示不兼容的 API 修改
- 次版本号变更表示向下兼容的功能性新增

### 版本生命周期
- 新版本发布后，旧版本至少维护 6 个月
- 废弃版本提前 3 个月通知
- 在响应头中包含版本信息

```http
API-Version: v1
API-Deprecated: false
API-Sunset: 2024-12-31
```

## HTTP 方法规范

| 方法 | 用途 | 幂等性 | 安全性 |
|------|------|--------|--------|
| GET | 获取资源 | ✓ | ✓ |
| POST | 创建资源 | ✗ | ✗ |
| PUT | 更新/替换资源 | ✓ | ✗ |
| PATCH | 部分更新资源 | ✗ | ✗ |
| DELETE | 删除资源 | ✓ | ✗ |
| HEAD | 获取资源元信息 | ✓ | ✓ |
| OPTIONS | 获取支持的方法 | ✓ | ✓ |

### 使用示例
```http
GET /api/v1/users          # 获取用户列表
GET /api/v1/users/123      # 获取特定用户
POST /api/v1/users         # 创建新用户
PUT /api/v1/users/123      # 完整更新用户
PATCH /api/v1/users/123    # 部分更新用户
DELETE /api/v1/users/123   # 删除用户
```

## 资源命名规范

### 基本规则
- 使用复数名词表示集合资源
- 使用小写字母和连字符
- 避免使用动词
- 保持简洁明了

### 正确示例
```
/api/v1/users
/api/v1/user-profiles
/api/v1/order-items
/api/v1/product-categories
```

### 错误示例
```
/api/v1/getUsers          # 包含动词
/api/v1/user_profiles     # 使用下划线
/api/v1/UserProfiles      # 使用大写字母
/api/v1/user              # 使用单数
```

### 嵌套资源
```
/api/v1/users/123/orders           # 用户的订单
/api/v1/orders/456/items           # 订单的商品项
/api/v1/categories/789/products    # 分类下的产品
```

### 特殊操作
对于不能用标准 CRUD 操作表示的业务逻辑，使用子资源：
```
/api/v1/users/123/activate         # 激活用户
/api/v1/orders/456/cancel          # 取消订单
/api/v1/products/789/publish       # 发布产品
```

## 查询参数规范

### 分页参数
```
GET /api/v1/users?page=1&limit=20&offset=0
```

| 参数 | 说明 | 默认值 | 最大值 |
|------|------|--------|--------|
| page | 页码 | 1 | - |
| limit | 每页数量 | 20 | 100 |
| offset | 偏移量 | 0 | - |

### 排序参数
```
GET /api/v1/users?sort=created_at&order=desc
GET /api/v1/users?sort=name,created_at&order=asc,desc
```

### 过滤参数
```
GET /api/v1/users?status=active&role=admin
GET /api/v1/products?price_min=100&price_max=500
GET /api/v1/orders?created_after=2024-01-01&created_before=2024-12-31
```

### 字段选择
```
GET /api/v1/users?fields=id,name,email
GET /api/v1/users?exclude=password,secret_key
```

### 搜索参数
```
GET /api/v1/users?q=john&search_fields=name,email
GET /api/v1/products?search=laptop&category=electronics
```

## 响应格式规范

### 统一响应结构
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "version": "v1"
  }
}
```

### 成功响应示例

#### 单个资源
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 123,
    "name": "张三",
    "email": "zhangsan@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "version": "v1"
  }
}
```

#### 资源列表
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 123,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    {
      "id": 124,
      "name": "李四",
      "email": "lisi@example.com"
    }
  ],
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "version": "v1",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### HTTP 状态码规范

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功获取资源 |
| 201 | Created | 成功创建资源 |
| 204 | No Content | 成功删除资源或更新无返回内容 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 请求格式正确但语义错误 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |

## 错误处理规范

### 错误响应结构
```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确",
        "code": "INVALID_EMAIL"
      },
      {
        "field": "password",
        "message": "密码长度至少8位",
        "code": "PASSWORD_TOO_SHORT"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "version": "v1"
  }
}
```

### 错误类型定义

| 错误类型 | 说明 | HTTP 状态码 |
|----------|------|-------------|
| VALIDATION_ERROR | 参数验证错误 | 400 |
| AUTHENTICATION_ERROR | 认证错误 | 401 |
| AUTHORIZATION_ERROR | 授权错误 | 403 |
| RESOURCE_NOT_FOUND | 资源不存在 | 404 |
| RESOURCE_CONFLICT | 资源冲突 | 409 |
| RATE_LIMIT_EXCEEDED | 超出限流 | 429 |
| INTERNAL_ERROR | 内部错误 | 500 |
| SERVICE_UNAVAILABLE | 服务不可用 | 503 |

## 认证与授权

### 认证方式

#### JWT Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Key
```http
X-API-Key: your-api-key-here
```

### 权限控制
- 使用基于角色的访问控制（RBAC）
- 支持细粒度权限控制
- 权限验证在路由层面进行

### 安全头部
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 限流与缓存

### 限流策略
- 基于用户的限流：每用户每分钟 100 次请求
- 基于 IP 的限流：每 IP 每分钟 1000 次请求
- 基于 API Key 的限流：根据套餐不同设置不同限制

### 限流响应头
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
Retry-After: 60
```

### 缓存策略
```http
Cache-Control: public, max-age=3600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT
```

## 文档与测试

### API 文档
- 使用 OpenAPI 3.0 规范
- 提供交互式文档（Swagger UI）
- 包含完整的示例和说明
- 自动生成客户端 SDK

### 测试要求
- 单元测试覆盖率 > 80%
- 集成测试覆盖所有 API 端点
- 性能测试确保响应时间 < 200ms
- 安全测试防范常见攻击

## 示例

### 用户管理 API

```yaml
# 获取用户列表
GET /api/v1/users
# 查询参数：page, limit, sort, order, status, role, q

# 获取特定用户
GET /api/v1/users/{id}

# 创建用户
POST /api/v1/users
# 请求体：name, email, password, role

# 更新用户
PUT /api/v1/users/{id}
# 请求体：name, email, role

# 部分更新用户
PATCH /api/v1/users/{id}
# 请求体：需要更新的字段

# 删除用户
DELETE /api/v1/users/{id}

# 激活用户
POST /api/v1/users/{id}/activate

# 停用用户
POST /api/v1/users/{id}/deactivate

# 重置密码
POST /api/v1/users/{id}/reset-password
```

### 订单管理 API

```yaml
# 获取订单列表
GET /api/v1/orders
# 查询参数：page, limit, sort, order, status, user_id, created_after, created_before

# 获取特定订单
GET /api/v1/orders/{id}

# 创建订单
POST /api/v1/orders
# 请求体：user_id, items, shipping_address, payment_method

# 更新订单
PUT /api/v1/orders/{id}
# 请求体：items, shipping_address, payment_method

# 取消订单
POST /api/v1/orders/{id}/cancel

# 确认订单
POST /api/v1/orders/{id}/confirm

# 发货
POST /api/v1/orders/{id}/ship
# 请求体：tracking_number, carrier

# 获取订单项
GET /api/v1/orders/{id}/items

# 添加订单项
POST /api/v1/orders/{id}/items
# 请求体：product_id, quantity, price

# 更新订单项
PUT /api/v1/orders/{order_id}/items/{item_id}
# 请求体：quantity, price

# 删除订单项
DELETE /api/v1/orders/{order_id}/items/{item_id}
```

### 产品管理 API

```yaml
# 获取产品列表
GET /api/v1/products
# 查询参数：page, limit, sort, order, category, status, price_min, price_max, q

# 获取特定产品
GET /api/v1/products/{id}

# 创建产品
POST /api/v1/products
# 请求体：name, description, price, category_id, images, attributes

# 更新产品
PUT /api/v1/products/{id}
# 请求体：name, description, price, category_id, images, attributes

# 删除产品
DELETE /api/v1/products/{id}

# 发布产品
POST /api/v1/products/{id}/publish

# 下架产品
POST /api/v1/products/{id}/unpublish

# 获取产品分类
GET /api/v1/categories

# 获取特定分类下的产品
GET /api/v1/categories/{id}/products
```

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2024-01-15 | 初始版本 |

---

**注意：本规范是活文档，会根据业务需求和技术发展持续更新。所有变更都会在版本历史中记录。**