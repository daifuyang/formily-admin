import mongoose, { Schema } from 'mongoose'
import { FormDefinitionDocument, FormInstanceDocument } from '../types/form'

// 表单定义 Schema
const FormDefinitionSchema = new Schema({
  formId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  schema: {
    type: Schema.Types.Mixed,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'form_definitions'
})

// 表单实例 Schema
const FormInstanceSchema = new Schema({
  instanceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  formId: {
    type: String,
    required: true,
    index: true
  },
  formVersion: {
    type: Number,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  submittedBy: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'form_instances'
})

// 添加索引
FormDefinitionSchema.index({ formId: 1, version: -1 })
FormDefinitionSchema.index({ status: 1, createdAt: -1 })
FormDefinitionSchema.index({ createdBy: 1, createdAt: -1 })

FormInstanceSchema.index({ formId: 1, createdAt: -1 })
FormInstanceSchema.index({ submittedBy: 1, createdAt: -1 })
FormInstanceSchema.index({ status: 1, submittedAt: -1 })
FormInstanceSchema.index({ formId: 1, status: 1 })

// 中间件：自动更新版本号
FormDefinitionSchema.pre('save', function(next) {
  const doc = this as any
  if (doc.isNew) {
    doc.version = 1
  } else if (doc.isModified('schema')) {
    doc.version += 1
  }
  next()
})

// 中间件：设置提交时间
FormInstanceSchema.pre('save', function(next) {
  const doc = this as any
  if (doc.isModified('status') && doc.status === 'submitted' && !doc.submittedAt) {
    doc.submittedAt = new Date()
  }
  next()
})

// 导出模型
export const FormDefinitionModel = mongoose.model<FormDefinitionDocument>('FormDefinition', FormDefinitionSchema)
export const FormInstanceModel = mongoose.model<FormInstanceDocument>('FormInstance', FormInstanceSchema)