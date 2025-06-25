import React from 'react';
import {
  FormButtonGroup,
  FormGrid,
  FormItem,
  FormLayout,
  Input,
  Password,
  Select,
  TreeSelect,
  DatePicker,
  TimePicker,
  NumberPicker,
  Transfer,
  Cascader,
  Radio,
  Checkbox,
  Upload,
  Switch,
  ArrayCards,
  ArrayItems,
  ArrayTable,
  ArrayTabs,
  FormCollapse,
  FormStep,
  FormTab,
  Editable,
  PreviewText,
  Space,
  Submit,
  Reset,
} from '@formily/antd-v5';
import { createForm } from '@formily/core';
import {
  createSchemaField,
  FormProvider,
  ISchema,
} from '@formily/react';

interface SchemaFormProps {
  schema: ISchema;
  onSubmit: (values: any) => void;
  onReset?: () => void;
  form?: any;
  className?: string;
  style?: React.CSSProperties;
}

// 创建可复用的 SchemaField 组件，包含所有 Formily Antd-v5 组件
const SchemaField = createSchemaField({
  components: {
    // 布局组件
    FormLayout,
    FormItem,
    FormGrid,
    FormButtonGroup,
    Space,
    
    // 输入控件
    Input,
    Password,
    Select,
    TreeSelect,
    DatePicker,
    TimePicker,
    NumberPicker,
    Transfer,
    Cascader,
    Radio,
    Checkbox,
    Upload,
    Switch,
    
    // 场景组件
    ArrayCards,
    ArrayItems,
    ArrayTable,
    ArrayTabs,
    FormCollapse,
    FormStep,
    FormTab,
    Editable,
    
    // 阅读状态组件
    PreviewText,
    
    // 操作组件
    Submit,
    Reset,
  },
});

const SchemaForm: React.FC<SchemaFormProps> = ({
  schema,
  onSubmit,
  onReset,
  form,
  className,
  style,
}) => {
  // 创建表单实例，如果外部传入则使用外部的
  const formInstance = form || createForm();
  
  const handleSubmit = (values: any) => {
    onSubmit?.(values);
  };
  
  const handleReset = () => {
    formInstance.reset();
    onReset?.();
  };
  
  return (
    <div className={className} style={style}>
      <FormProvider form={formInstance}>
        <SchemaField schema={schema} />
        <FormButtonGroup>
          <Submit onSubmit={handleSubmit}>提交</Submit>
          <Reset onClick={handleReset}>重置</Reset>
        </FormButtonGroup>
      </FormProvider>
    </div>
  );
};

export default SchemaForm;
export type { SchemaFormProps };