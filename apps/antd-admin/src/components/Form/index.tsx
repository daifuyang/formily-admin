import React from 'react';
import { FormItem, Input, FormGrid, Cascader } from '@formily/antd-v5';
import { FormProvider, ISchema, createSchemaField } from '@formily/react';
import { createForm } from '@formily/core';

interface FormProps {
  schema?: ISchema;
}

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    FormGrid,
    Cascader,
  },
});

export const useForm = () => {
  const form = React.useMemo(() => createForm(), []);
  return form;
};

const Form: React.FC<FormProps> = (props) => {
  const { schema } = props;
  const form = useForm();

  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} />
    </FormProvider>
  );
};

export default Form;
