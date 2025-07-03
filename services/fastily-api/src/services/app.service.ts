/**
 * 应用管理服务
 */
import { FastifyInstance } from 'fastify'
import { App, AppStatus, AppUser, AppUserRole, AppGroup, AppVersion } from '../models/app'

export class AppService {
  private fastify: FastifyInstance
  private appCollection: any
  private appUserCollection: any
  private appGroupCollection: any
  private appVersionCollection: any

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify
    
    // 确保MongoDB已连接
    if (!this.fastify.mongo || !this.fastify.mongo.db) {
      throw new Error('MongoDB connection not available')
    }
    
    this.appCollection = this.fastify.mongo.db.collection('apps')
    this.appUserCollection = this.fastify.mongo.db.collection('app_users')
    this.appGroupCollection = this.fastify.mongo.db.collection('app_groups')
    this.appVersionCollection = this.fastify.mongo.db.collection('app_versions')

    // 创建索引
    this.createIndexes()
  }

  /**
   * 创建必要的索引
   */
  private async createIndexes() {
    // apps 集合索引
    await this.appCollection.createIndex({ name: 1 })
    await this.appCollection.createIndex({ status: 1 })
    await this.appCollection.createIndex({ group_id: 1 })
    await this.appCollection.createIndex({ created_by: 1 })

    // app_users 集合索引
    await this.appUserCollection.createIndex({ app_id: 1 })
    await this.appUserCollection.createIndex({ user_id: 1 })
    await this.appUserCollection.createIndex({ app_id: 1, user_id: 1 }, { unique: true })

    // app_groups 集合索引
    await this.appGroupCollection.createIndex({ name: 1 })
    await this.appGroupCollection.createIndex({ created_by: 1 })

    // app_versions 集合索引
    await this.appVersionCollection.createIndex({ app_id: 1 })
    await this.appVersionCollection.createIndex({ app_id: 1, version: 1 }, { unique: true })
  }

  /**
   * 获取应用列表
   * @param query 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @param sort 排序字段
   * @param order 排序方向
   */
  async getApps(query: any = {}, page = 1, limit = 20, sort = 'created_at', order = 'desc') {
    // 默认只查询未删除的应用
    const filter: any = { status: { $ne: AppStatus.DELETED } }

    // 添加其他查询条件
    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' }
    }

    if (query.group_id) {
      filter.group_id = new this.fastify.mongo.ObjectId(query.group_id)
    }

    if (query.status && query.status !== 'all') {
      filter.status = query.status
    }

    if (query.created_by) {
      filter.created_by = new this.fastify.mongo.ObjectId(query.created_by)
    }

    // 计算总数
    const total = await this.appCollection.countDocuments(filter)

    // 查询数据
    const sortOption: any = {}
    sortOption[sort] = order === 'desc' ? -1 : 1

    const skip = (page - 1) * limit
    const apps = await this.appCollection
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    return {
      data: apps,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 获取应用详情
   * @param id 应用ID
   */
  async getAppById(id: string) {
    const objectId = new this.fastify.mongo.ObjectId(id)
    return this.appCollection.findOne({ _id: objectId })
  }

  /**
   * 创建应用
   * @param app 应用信息
   */
  async createApp(app: Partial<App>) {
    const now = new Date()
    const newApp: App = {
      ...app,
      status: AppStatus.ACTIVE,
      created_at: now,
      updated_at: now,
      created_by: new this.fastify.mongo.ObjectId(app.created_by)
    } as App

    const result = await this.appCollection.insertOne(newApp)
    return { ...newApp, _id: result.insertedId }
  }

  /**
   * 更新应用
   * @param id 应用ID
   * @param app 应用信息
   */
  async updateApp(id: string, app: Partial<App>) {
    const objectId = new this.fastify.mongo.ObjectId(id)
    const updateData: any = {
      ...app,
      updated_at: new Date()
    }

    if (app.updated_by) {
      updateData.updated_by = new this.fastify.mongo.ObjectId(app.updated_by)
    }

    // 不允许更新的字段
    delete updateData._id
    delete updateData.created_at
    delete updateData.created_by

    const result = await this.appCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result.value
  }

  /**
   * 删除应用（软删除）
   * @param id 应用ID
   * @param userId 操作用户ID
   */
  async deleteApp(id: string, userId: string) {
    const objectId = new this.fastify.mongo.ObjectId(id)
    const now = new Date()

    const result = await this.appCollection.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          status: AppStatus.DELETED,
          deleted_at: now,
          updated_at: now,
          updated_by: new this.fastify.mongo.ObjectId(userId)
        }
      },
      { returnDocument: 'after' }
    )

    return result.value
  }

  /**
   * 归档应用
   * @param id 应用ID
   * @param userId 操作用户ID
   */
  async archiveApp(id: string, userId: string) {
    const objectId = new this.fastify.mongo.ObjectId(id)
    const now = new Date()

    const result = await this.appCollection.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          status: AppStatus.ARCHIVED,
          updated_at: now,
          updated_by: new this.fastify.mongo.ObjectId(userId)
        }
      },
      { returnDocument: 'after' }
    )

    return result.value
  }

  /**
   * 恢复应用
   * @param id 应用ID
   * @param userId 操作用户ID
   */
  async restoreApp(id: string, userId: string) {
    const objectId = new this.fastify.mongo.ObjectId(id)
    const now = new Date()

    const result = await this.appCollection.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          status: AppStatus.ACTIVE,
          updated_at: now,
          updated_by: new this.fastify.mongo.ObjectId(userId),
          deleted_at: null
        }
      },
      { returnDocument: 'after' }
    )

    return result.value
  }

  /**
   * 获取应用成员列表
   * @param appId 应用ID
   */
  async getAppUsers(appId: string) {
    const objectId = new this.fastify.mongo.ObjectId(appId)
    return this.appUserCollection.find({ app_id: objectId }).toArray()
  }

  /**
   * 添加应用成员
   * @param appUser 应用成员信息
   */
  async addAppUser(appUser: Partial<AppUser>) {
    const now = new Date()
    const newAppUser: AppUser = {
      ...appUser,
      app_id: new this.fastify.mongo.ObjectId(appUser.app_id),
      user_id: new this.fastify.mongo.ObjectId(appUser.user_id),
      created_at: now,
      updated_at: now
    } as AppUser

    try {
      const result = await this.appUserCollection.insertOne(newAppUser)
      return { ...newAppUser, _id: result.insertedId }
    } catch (error: any) {
      // 处理唯一索引冲突
      if (error.code === 11000) {
        throw new Error('用户已经是应用成员')
      }
      throw error
    }
  }

  /**
   * 更新应用成员角色
   * @param appId 应用ID
   * @param userId 用户ID
   * @param role 角色
   */
  async updateAppUserRole(appId: string, userId: string, role: AppUserRole) {
    const appObjectId = new this.fastify.mongo.ObjectId(appId)
    const userObjectId = new this.fastify.mongo.ObjectId(userId)

    const result = await this.appUserCollection.findOneAndUpdate(
      { app_id: appObjectId, user_id: userObjectId },
      {
        $set: {
          role,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result.value
  }

  /**
   * 移除应用成员
   * @param appId 应用ID
   * @param userId 用户ID
   */
  async removeAppUser(appId: string, userId: string) {
    const appObjectId = new this.fastify.mongo.ObjectId(appId)
    const userObjectId = new this.fastify.mongo.ObjectId(userId)

    const result = await this.appUserCollection.deleteOne({
      app_id: appObjectId,
      user_id: userObjectId
    })

    return result.deletedCount > 0
  }

  /**
   * 获取应用分组列表
   */
  async getAppGroups() {
    return this.appGroupCollection.find().sort({ name: 1 }).toArray()
  }

  /**
   * 创建应用分组
   * @param group 分组信息
   */
  async createAppGroup(group: Partial<AppGroup>) {
    const now = new Date()
    const newGroup: AppGroup = {
      ...group,
      created_at: now,
      updated_at: now,
      created_by: new this.fastify.mongo.ObjectId(group.created_by)
    } as AppGroup

    const result = await this.appGroupCollection.insertOne(newGroup)
    return { ...newGroup, _id: result.insertedId }
  }

  /**
   * 更新应用分组
   * @param id 分组ID
   * @param group 分组信息
   */
  async updateAppGroup(id: string, group: Partial<AppGroup>) {
    const objectId = new this.fastify.mongo.ObjectId(id)
    const updateData: any = {
      ...group,
      updated_at: new Date()
    }

    if (group.updated_by) {
      updateData.updated_by = new this.fastify.mongo.ObjectId(group.updated_by)
    }

    // 不允许更新的字段
    delete updateData._id
    delete updateData.created_at
    delete updateData.created_by

    const result = await this.appGroupCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result.value
  }

  /**
   * 删除应用分组
   * @param id 分组ID
   */
  async deleteAppGroup(id: string) {
    const objectId = new this.fastify.mongo.ObjectId(id)
    const result = await this.appGroupCollection.deleteOne({ _id: objectId })
    return result.deletedCount > 0
  }

  /**
   * 获取应用版本列表
   * @param appId 应用ID
   */
  async getAppVersions(appId: string) {
    const objectId = new this.fastify.mongo.ObjectId(appId)
    return this.appVersionCollection
      .find({ app_id: objectId })
      .sort({ created_at: -1 })
      .toArray()
  }

  /**
   * 获取应用版本详情
   * @param appId 应用ID
   * @param version 版本号
   */
  async getAppVersion(appId: string, version: string) {
    const objectId = new this.fastify.mongo.ObjectId(appId)
    return this.appVersionCollection.findOne({
      app_id: objectId,
      version
    })
  }

  /**
   * 创建应用版本
   * @param version 版本信息
   */
  async createAppVersion(version: Partial<AppVersion>) {
    const now = new Date()
    const newVersion: AppVersion = {
      ...version,
      app_id: new this.fastify.mongo.ObjectId(version.app_id),
      status: 'draft',
      created_at: now,
      created_by: new this.fastify.mongo.ObjectId(version.created_by)
    } as AppVersion

    try {
      const result = await this.appVersionCollection.insertOne(newVersion)
      return { ...newVersion, _id: result.insertedId }
    } catch (error: any) {
      // 处理唯一索引冲突
      if (error.code === 11000) {
        throw new Error('版本号已存在')
      }
      throw error
    }
  }

  /**
   * 发布应用版本
   * @param appId 应用ID
   * @param version 版本号
   */
  async publishAppVersion(appId: string, version: string) {
    const appObjectId = new this.fastify.mongo.ObjectId(appId)
    const now = new Date()

    const result = await this.appVersionCollection.findOneAndUpdate(
      { app_id: appObjectId, version },
      {
        $set: {
          status: 'published',
          published_at: now
        }
      },
      { returnDocument: 'after' }
    )

    return result.value
  }
}