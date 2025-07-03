# 应用管理PRD（参考宜搭逻辑）

## 一、产品目标
- 提供应用的全生命周期管理能力，包括创建、配置、发布、权限、监控等。
- 支持多角色协作，提升企业应用开发与运维效率。

## 二、核心功能模块
1. 应用列表
   - 展示所有可见应用，支持搜索、筛选、排序。
   - 支持新建、复制、删除、归档、恢复等操作。
2. 应用创建与配置
   - 支持模板创建、空白创建。
   - 应用基础信息配置（名称、描述、图标、分组等）。
   - 应用分组/分类管理。
3. 应用设计
   - 页面设计器：可视化拖拽页面、表单、流程等。
   - 数据建模：自定义数据表、字段、关系。
   - 业务流程编排：流程节点、条件、自动化。
4. 权限与成员管理
   - 支持应用级、页面级、数据级权限。
   - 成员邀请、角色分配（如管理员、开发者、使用者等）。
   - 角色权限自定义。
5. 应用发布与版本管理
   - 支持草稿、预发布、正式发布等多阶段。
   - 版本历史查看、回滚。
   - 发布日志记录。
6. 应用监控与运维
   - 访问统计、操作日志、异常告警。
   - 应用健康状态监控。
7. 其他辅助功能
   - 应用导入导出。
   - 应用市场/模板中心对接。
   - 支持多端适配（PC、移动）。

## 三、角色权限说明
- 超级管理员：拥有所有应用的管理权限。
- 应用管理员：管理指定应用的全功能。
- 开发者：可设计页面、配置流程、管理数据模型。
- 普通成员：仅可使用分配权限的应用。

## 四、页面结构建议
- 应用管理首页：应用列表、分组导航、快速入口。
- 应用详情页：基本信息、成员管理、权限配置、版本历史、监控面板。
- 应用设计器页：页面设计、数据建模、流程编排等子模块。

## 五、关键交互流程
- 新建应用流程
- 应用成员邀请与权限分配流程
- 应用发布与回滚流程
- 应用归档与恢复流程

## 六、非功能性需求
- 安全性：权限校验、数据隔离、操作日志。
- 易用性：界面简洁、操作引导、错误提示友好。
- 扩展性：支持插件/组件扩展。

---

如需详细功能点拆解、页面原型或流程图，可进一步补充。

---

## 七、API 路由规范
- 遵循 RESTful 设计风格，资源名用复数小写短横线分隔（如 apps、app-users）。
- 路由结构示例：
  - `GET /api/v1/apps` 获取应用列表
  - `POST /api/v1/apps` 新建应用
  - `GET /api/v1/apps/{id}` 获取应用详情
  - `PUT /api/v1/apps/{id}` 更新应用
  - `DELETE /api/v1/apps/{id}` 删除应用
- 支持嵌套资源与子资源操作，如：
  - `GET /api/v1/apps/{id}/members` 获取应用成员
  - `POST /api/v1/apps/{id}/archive` 归档应用
- 查询参数支持分页、排序、过滤、字段选择等：
  - `GET /api/v1/apps?page=1&limit=20&sort=created_at&order=desc`
- 响应结构统一，包含 success、code、message、data、meta 字段。

## 八、数据库设计规范（MongoDB版）
- 命名规范：集合名用复数小写短横线分隔（如 apps、app-users），字段名用小写下划线。
- 主键统一使用ObjectId（_id），业务唯一键建议单独字段维护。
- 常用字段：created_at、updated_at、deleted_at（软删除）、created_by、updated_by。
- **时间处理：所有时间字段（如 created_at, updated_at, deleted_at）均存储为 UTC 时间，在应用层根据用户时区（如中国时区）进行转换显示。**
- 关联关系：推荐使用引用（Reference），如 app_id、user_id。
- 文档结构应避免深层嵌套，适度扁平化，便于索引和查询。
- 建议为常用查询字段建立索引，如 app_id、user_id、status。
- 示例集合结构：

```json
// apps 集合
{
  "_id": ObjectId,
  "name": "应用名称",
  "description": "描述",
  "icon": "图标URL",
  "group_id": ObjectId,
  "status": "active",
  "created_at": ISODate,
  "updated_at": ISODate,
  "deleted_at": ISODate,
  "created_by": ObjectId,
  "updated_by": ObjectId
}

// app_users 集合
{
  "_id": ObjectId,
  "app_id": ObjectId,
  "user_id": ObjectId,
  "role": "admin|developer|member",
  "created_at": ISODate,
  "updated_at": ISODate
}
```
- 其他集合如 users、groups、logs、permissions 可按需设计。
- 数据一致性建议通过应用层保障，重要操作可用事务（如MongoDB 4.0+）。
- 软删除建议用 deleted_at 字段，查询时默认过滤。

## 九、开发规范
- 代码风格统一，前端推荐使用 ESLint + Prettier，后端遵循团队代码规范。
- 接口文档与代码同步，推荐使用 OpenAPI/Swagger 自动生成。
- 严格类型校验，接口参数和响应结构需定义类型。
- 日志与异常处理规范，敏感信息脱敏。
- 单元测试和集成测试覆盖主要业务逻辑。
- 版本控制规范，分支命名如 feature/xxx、fix/xxx、release/xxx。
- 安全规范：权限校验、输入校验、防止注入、XSS等。

---

如需进一步细化API、数据库ER图或开发流程，可随时补充。