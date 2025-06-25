import { ISchema } from '@formily/react';
import { Form } from '@formily/core';

// SchemaForm 组件属性接口
export interface SchemaFormProps {
  /** JSON Schema 配置 */
  schema: ISchema;
  /** 表单提交回调 */
  onSubmit: (values: any) => void;
  /** 表单重置回调 */
  onReset?: () => void;
  /** 外部传入的表单实例 */
  form?: Form;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义内联样式 */
  style?: React.CSSProperties;
  /** 是否显示提交按钮 */
  showSubmit?: boolean;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 提交按钮文本 */
  submitText?: string;
  /** 重置按钮文本 */
  resetText?: string;
  /** 表单初始值 */
  initialValues?: any;
  /** 表单验证失败回调 */
  onValidateFailed?: (errors: any) => void;
}

// 常用的 Schema 字段类型
export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'void';
  title?: string;
  description?: string;
  required?: boolean;
  'x-decorator'?: string;
  'x-component'?: string;
  'x-component-props'?: Record<string, any>;
  'x-decorator-props'?: Record<string, any>;
  'x-validator'?: any;
  'x-reactions'?: any;
  'x-display'?: 'visible' | 'hidden' | 'none';
  'x-pattern'?: 'editable' | 'disabled' | 'readOnly' | 'readPretty';
  enum?: Array<{ label: string; value: any }>;
  default?: any;
  properties?: Record<string, SchemaField>;
}

// 表单布局配置
export interface FormLayoutConfig {
  layout?: 'vertical' | 'horizontal' | 'inline';
  labelCol?: { span?: number; offset?: number };
  wrapperCol?: { span?: number; offset?: number };
  colon?: boolean;
  labelAlign?: 'left' | 'right';
  labelWrap?: boolean;
  size?: 'small' | 'middle' | 'large';
}

// 网格布局配置
export interface GridLayoutConfig {
  minColumns?: number | number[];
  maxColumns?: number | number[];
  breakpoints?: number[];
  columnGap?: number;
  rowGap?: number;
}

// 常用组件的 Schema 模板
export const SchemaTemplates = {
  // 输入框
  input: (title: string, name: string, required = false): SchemaField => ({
    type: 'string',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  }),
  
  // 密码输入框
  password: (title: string, name: string, required = false): SchemaField => ({
    type: 'string',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'Password',
  }),
  
  // 数字输入框
  number: (title: string, name: string, required = false): SchemaField => ({
    type: 'number',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
  }),
  
  // 选择器
  select: (title: string, name: string, options: Array<{ label: string; value: any }>, required = false): SchemaField => ({
    type: 'string',
    title,
    required,
    enum: options,
    'x-decorator': 'FormItem',
    'x-component': 'Select',
  }),
  
  // 日期选择器
  datePicker: (title: string, name: string, required = false): SchemaField => ({
    type: 'string',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'DatePicker',
  }),
  
  // 时间选择器
  timePicker: (title: string, name: string, required = false): SchemaField => ({
    type: 'string',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'TimePicker',
  }),
  
  // 单选框组
  radio: (title: string, name: string, options: Array<{ label: string; value: any }>, required = false): SchemaField => ({
    type: 'string',
    title,
    required,
    enum: options,
    'x-decorator': 'FormItem',
    'x-component': 'Radio.Group',
  }),
  
  // 复选框组
  checkbox: (title: string, name: string, options: Array<{ label: string; value: any }>, required = false): SchemaField => ({
    type: 'array',
    title,
    required,
    enum: options,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox.Group',
  }),
  
  // 开关
  switch: (title: string, name: string, required = false): SchemaField => ({
    type: 'boolean',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  }),
  
  // 文本域
  textarea: (title: string, name: string, required = false): SchemaField => ({
    type: 'string',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  }),
  
  // 文件上传
  upload: (title: string, name: string, required = false): SchemaField => ({
    type: 'array',
    title,
    required,
    'x-decorator': 'FormItem',
    'x-component': 'Upload',
    'x-component-props': {
      textContent: '点击上传',
    },
  }),
};