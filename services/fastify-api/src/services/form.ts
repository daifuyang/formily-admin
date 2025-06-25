import { Types } from 'mongoose'
import { FormDefinitionModel, FormInstanceModel } from '../models/form'
import {
  FormDefinition,
  FormInstance,
  CreateFormDefinitionRequest,
  UpdateFormDefinitionRequest,
  CreateFormInstanceRequest,
  UpdateFormInstanceRequest,
  SearchFormInstancesRequest,
  PaginatedResponse
} from '../types/form'

export class FormService {
  // 表单定义相关方法
  
  /**
   * 创建表单定义
   */
  async createFormDefinition(data: CreateFormDefinitionRequest, createdBy: string): Promise<FormDefinition> {
    const formDefinition = new FormDefinitionModel({
      ...data,
      createdBy
    })
    
    return await formDefinition.save()
  }
  
  /**
   * 获取表单定义
   */
  async getFormDefinition(formId: string): Promise<FormDefinition | null> {
    return await FormDefinitionModel.findOne({ formId, status: { $ne: 'archived' } })
      .sort({ version: -1 })
      .lean()
  }
  
  /**
   * 根据ID获取表单定义
   */
  async getFormDefinitionById(id: string): Promise<FormDefinition | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null
    }
    return await FormDefinitionModel.findById(id).lean()
  }
  
  /**
   * 更新表单定义
   */
  async updateFormDefinition(formId: string, data: UpdateFormDefinitionRequest): Promise<FormDefinition | null> {
    return await FormDefinitionModel.findOneAndUpdate(
      { formId },
      { ...data, updatedAt: new Date() },
      { new: true, lean: true }
    )
  }
  
  /**
   * 删除表单定义（软删除）
   */
  async deleteFormDefinition(formId: string): Promise<boolean> {
    const result = await FormDefinitionModel.updateOne(
      { formId },
      { status: 'archived', updatedAt: new Date() }
    )
    return result.modifiedCount > 0
  }
  
  /**
   * 获取表单定义列表
   */
  async getFormDefinitions(page = 1, pageSize = 20, status?: string): Promise<PaginatedResponse<FormDefinition>> {
    const query: any = {}
    if (status) {
      query.status = status
    } else {
      query.status = { $ne: 'archived' }
    }
    
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      FormDefinitionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      FormDefinitionModel.countDocuments(query)
    ])
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
  
  // 表单实例相关方法
  
  /**
   * 创建表单实例
   */
  async createFormInstance(data: CreateFormInstanceRequest, submittedBy: string): Promise<FormInstance> {
    // 获取表单定义以获取版本号
    const formDefinition = await this.getFormDefinition(data.formId)
    if (!formDefinition) {
      throw new Error('Form definition not found')
    }
    
    const instanceId = `${data.formId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const formInstance = new FormInstanceModel({
      instanceId,
      formId: data.formId,
      formVersion: formDefinition.version,
      data: data.data,
      submittedBy
    })
    
    return await formInstance.save()
  }
  
  /**
   * 获取表单实例
   */
  async getFormInstance(instanceId: string): Promise<FormInstance | null> {
    return await FormInstanceModel.findOne({ instanceId }).lean()
  }
  
  /**
   * 根据ID获取表单实例
   */
  async getFormInstanceById(id: string): Promise<FormInstance | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null
    }
    return await FormInstanceModel.findById(id).lean()
  }
  
  /**
   * 更新表单实例
   */
  async updateFormInstance(instanceId: string, data: UpdateFormInstanceRequest): Promise<FormInstance | null> {
    return await FormInstanceModel.findOneAndUpdate(
      { instanceId },
      { ...data, updatedAt: new Date() },
      { new: true, lean: true }
    )
  }
  
  /**
   * 删除表单实例
   */
  async deleteFormInstance(instanceId: string): Promise<boolean> {
    const result = await FormInstanceModel.deleteOne({ instanceId })
    return result.deletedCount > 0
  }
  
  /**
   * 搜索表单实例
   */
  async searchFormInstances(params: SearchFormInstancesRequest): Promise<PaginatedResponse<FormInstance>> {
    const {
      formId,
      status,
      submittedBy,
      dateRange,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params
    
    const query: any = {}
    
    if (formId) {
      query.formId = formId
    }
    
    if (status) {
      query.status = status
    }
    
    if (submittedBy) {
      query.submittedBy = submittedBy
    }
    
    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    }
    
    const skip = (page - 1) * pageSize
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    const [data, total] = await Promise.all([
      FormInstanceModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      FormInstanceModel.countDocuments(query)
    ])
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
  
  /**
   * 获取表单实例统计信息
   */
  async getFormInstanceStats(formId?: string): Promise<any> {
    const matchStage: any = {}
    if (formId) {
      matchStage.formId = formId
    }
    
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]
    
    const stats = await FormInstanceModel.aggregate(pipeline)
    
    const result = {
      total: 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    }
    
    stats.forEach(stat => {
      result[stat._id as keyof typeof result] = stat.count
      result.total += stat.count
    })
    
    return result
  }
}

// 导出单例
export const formService = new FormService()