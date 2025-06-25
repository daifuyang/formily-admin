# SchemaForm 组件

基于 Formily 和 Ant Design v5 的通用表单组件，通过 JSON Schema 快速生成表单页面。

## 特性

- 🚀 **JSON Schema 驱动** - 完全基于 JSON Schema 配置生成表单
- 📱 **响应式布局** - 内置 FormGrid 组件，自动适配不同屏幕尺寸
- ✅ **表单验证** - 集成 Formily 强大的验证系统
- 🎨 **丰富组件** - 支持所有 Formily Antd-v5 组件
- 🔧 **高度可定制** - 支持自定义样式和行为
- 📦 **开箱即用** - 内置常用表单模板和工具函数

## 安装

项目已包含所需依赖：

```json
{
  "@formily/antd-v5": "^1.2.4",
  "@formily/core": "^2.3.7",
  "@formily/react": "^2.3.7",
  "antd": "^5.13.2"
}
```

## 基础用法

```tsx
import React from 'react';
import SchemaForm from '@/components/SchemaForm';
import { ISchema } from '@formily/react';

const MyForm: React.FC = () => {
  const schema: ISchema = {
    type: 'object',
    properties: {
      grid: {
        type: 'void',
        'x-component': 'FormGrid',
        'x-component-props': {
          minColumns: [2, 3, 4],
        },
        properties: {
          username: {
            type: 'string',
            title: '用户名',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          email: {
            type: 'string',
            title: '邮箱',
            required: true,
            'x-validator': 'email',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      },
    },
  };

  const handleSubmit = (values: any) => {
    console.log('表单数据:', values);
  };

  return <SchemaForm schema={schema} onSubmit={handleSubmit} />;
};
```

## 使用工具函数

```tsx
import { createGridSchema, validators } from '@/components/SchemaForm/utils';

const schema = createGridSchema({
  username: {
    type: 'string',
    title: '用户名',
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': validators.required('请输入用户名'),
  },
  email: {
    type: 'string',
    title: '邮箱',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': [validators.required(), validators.email()],
  },
});
```

## API

### SchemaForm Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| schema | ISchema | - | 表单的 JSON Schema 配置 |
| onSubmit | (values: any) => void | - | 表单提交回调 |
| onReset | () => void | - | 表单重置回调 |
| form | Form | - | 外部传入的表单实例 |
| className | string | - | 自定义样式类名 |
| style | CSSProperties | - | 自定义内联样式 |

## 支持的组件

### 布局组件
- FormLayout - 表单布局
- FormItem - 表单项
- FormGrid - 网格布局
- FormButtonGroup - 按钮组
- Space - 间距

### 输入控件
- Input - 输入框
- Password - 密码输入框
- Select - 选择器
- TreeSelect - 树选择器
- DatePicker - 日期选择器
- TimePicker - 时间选择器
- NumberPicker - 数字输入框
- Transfer - 穿梭框
- Cascader - 级联选择器
- Radio - 单选框
- Checkbox - 复选框
- Upload - 文件上传
- Switch - 开关

### 场景组件
- ArrayCards - 数组卡片
- ArrayItems - 数组项
- ArrayTable - 数组表格
- ArrayTabs - 数组标签页
- FormCollapse - 折叠面板
- FormStep - 步骤表单
- FormTab - 标签页表单
- FormDialog - 弹窗表单
- FormDrawer - 抽屉表单
- Editable - 可编辑组件

### 阅读状态组件
- PreviewText - 预览文本

## 工具函数

### createFormSchema
创建带布局的表单 Schema

```tsx
const schema = createFormSchema(
  {
    username: { /* 字段配置 */ },
    email: { /* 字段配置 */ },
  },
  {
    layout: 'horizontal',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
    minColumns: [2, 3, 4],
  }
);
```

### createGridSchema
创建网格布局的表单 Schema

```tsx
const schema = createGridSchema(
  {
    username: { /* 字段配置 */ },
    email: { /* 字段配置 */ },
  },
  {
    minColumns: [2, 3, 4],
    columnGap: 20,
    rowGap: 16,
  }
);
```

### createArrayTableSchema
创建数组表格 Schema

```tsx
const arraySchema = createArrayTableSchema(
  {
    name: { /* 字段配置 */ },
    age: { /* 字段配置 */ },
  },
  '用户列表'
);
```

### 验证器

```tsx
import { validators } from '@/components/SchemaForm/utils';

// 必填验证
validators.required('请输入用户名')

// 邮箱验证
validators.email('请输入有效邮箱')

// 手机号验证
validators.phone('请输入有效手机号')

// 长度验证
validators.minLength(6, '最少6个字符')
validators.maxLength(20, '最多20个字符')

// 数值范围验证
validators.range(18, 65, '年龄必须在18-65之间')
```

### 响应式工具

```tsx
import { reactions } from '@/components/SchemaForm/utils';

// 字段联动显示/隐藏
'x-reactions': reactions.visible('userType')

// 字段联动启用/禁用
'x-reactions': reactions.disabled('isReadonly')

// 字段值联动
'x-reactions': reactions.value('condition', '{{$deps[0] ? "value1" : "value2"}}')
```

## 示例

查看 `examples.tsx` 文件了解更多使用示例：

- BasicFormExample - 基础表单
- ArrayTableExample - 数组表格
- ComplexFormExample - 复杂表单（标签页 + 折叠面板）
- ReactiveFormExample - 响应式表单

## Schema 配置说明

### 基本字段配置

```tsx
{
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'void',
  title: '字段标题',
  description: '字段描述',
  required: true, // 是否必填
  'x-decorator': 'FormItem', // 装饰器组件
  'x-component': 'Input', // 渲染组件
  'x-component-props': { // 组件属性
    placeholder: '请输入...',
  },
  'x-decorator-props': { // 装饰器属性
    tooltip: '提示信息',
  },
  'x-validator': 'email', // 验证规则
  'x-reactions': { // 响应式配置
    dependencies: ['otherField'],
    fulfill: {
      state: {
        visible: '{{!!$deps[0]}}',
      },
    },
  },
  'x-display': 'visible' | 'hidden' | 'none', // 显示状态
  'x-pattern': 'editable' | 'disabled' | 'readOnly' | 'readPretty', // 交互模式
  enum: [ // 选项数据
    { label: '选项1', value: 'value1' },
    { label: '选项2', value: 'value2' },
  ],
  default: '默认值',
}
```

### 网格布局配置

```tsx
'x-component-props': {
  minColumns: [2, 3, 4], // 不同断点的最小列数
  maxColumns: [4, 6, 8], // 不同断点的最大列数
  breakpoints: [720, 1280], // 断点配置
  columnGap: 20, // 列间距
  rowGap: 16, // 行间距
}
```

## 最佳实践

1. **使用工具函数** - 优先使用提供的工具函数创建 Schema，减少重复代码
2. **合理布局** - 根据表单复杂度选择合适的布局方式
3. **响应式设计** - 使用 FormGrid 实现响应式布局
4. **验证规则** - 使用内置验证器，保证数据质量
5. **字段联动** - 合理使用 reactions 实现字段间的联动效果
6. **组件复用** - 将常用的表单配置抽取为可复用的模板

## 注意事项

- 确保 Schema 结构正确，避免渲染错误
- 合理使用 `x-decorator` 和 `x-component`
- 注意字段名称的唯一性
- 复杂表单建议分步骤或分标签页展示
- 及时处理表单验证错误