import { Document as MongooseDocument } from 'mongoose'

// 表单字段类型
export type FormFieldType = 
  | 'Input' 
  | 'TextArea' 
  | 'Select' 
  | 'Radio' 
  | 'Checkbox' 
  | 'DatePicker' 
  | 'TimePicker' 
  | 'NumberPicker' 
  | 'Upload' 
  | 'Switch' 
  | 'Rate' 
  | 'Slider'

// 表单字段定义
export interface FormFieldDefinition {
  name: string
  type: FormFieldType
  title: string
  description?: string
  required?: boolean
  default?: any
  enum?: Array<{ label: string; value: any }>
  properties?: Record<string, any>
  'x-component-props'?: Record<string, any>
  'x-decorator'?: string
  'x-decorator-props'?: Record<string, any>
  'x-validator'?: any
  'x-reactions'?: any
}

// 表单定义
export interface FormDefinition {
  formId: string
  name: string
  description?: string
  schema: any
  version: number
  status: 'draft' | 'published' | 'archived'
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// 表单实例数据
export interface FormInstance {
  instanceId: string
  formId: string
  formVersion: number
  data: Record<string, any>
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submittedBy: string
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// MongoDB Document 类型
export type FormDefinitionDocument = FormDefinition & MongooseDocument
export type FormInstanceDocument = FormInstance & MongooseDocument

// API 请求/响应类型
export interface CreateFormDefinitionRequest {
  formId: string
  name: string
  description?: string
  schema: FormDefinition['schema']
}

export interface UpdateFormDefinitionRequest {
  name?: string
  description?: string
  schema?: FormDefinition['schema']
  status?: FormDefinition['status']
}

export interface CreateFormInstanceRequest {
  formId: string
  data: Record<string, any>
}

export interface UpdateFormInstanceRequest {
  data?: Record<string, any>
  status?: FormInstance['status']
}

export interface SearchFormInstancesRequest {
  formId?: string
  status?: FormInstance['status']
  submittedBy?: string
  dateRange?: {
    start: string
    end: string
  }
  dateRangeStart?: string
  dateRangeEnd?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}