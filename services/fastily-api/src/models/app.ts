/**
 * 应用管理相关的数据模型
 */

// 应用状态枚举
export enum AppStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// 应用用户角色枚举
export enum AppUserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  MEMBER = 'member'
}

// 应用基础信息接口
export interface App {
  _id?: any; // MongoDB ObjectId
  name: string; // 应用名称
  description?: string; // 应用描述
  icon?: string; // 应用图标URL
  group_id?: any; // 分组ID
  status: AppStatus; // 应用状态
  created_at: Date; // 创建时间
  updated_at: Date; // 更新时间
  deleted_at?: Date; // 删除时间（软删除）
  created_by: any; // 创建者ID
  updated_by?: any; // 更新者ID
}

// 应用用户关系接口
export interface AppUser {
  _id?: any; // MongoDB ObjectId
  app_id: any; // 应用ID
  user_id: any; // 用户ID
  role: AppUserRole; // 用户角色
  created_at: Date; // 创建时间
  updated_at: Date; // 更新时间
}

// 应用分组接口
export interface AppGroup {
  _id?: any; // MongoDB ObjectId
  name: string; // 分组名称
  description?: string; // 分组描述
  created_at: Date; // 创建时间
  updated_at: Date; // 更新时间
  created_by: any; // 创建者ID
  updated_by?: any; // 更新者ID
}

// 应用版本接口
export interface AppVersion {
  _id?: any; // MongoDB ObjectId
  app_id: any; // 应用ID
  version: string; // 版本号
  description?: string; // 版本描述
  config: any; // 版本配置（JSON格式）
  status: 'draft' | 'published'; // 版本状态
  created_at: Date; // 创建时间
  published_at?: Date; // 发布时间
  created_by: any; // 创建者ID
}