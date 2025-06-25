import React, { useState } from 'react';
import { Card, Tabs, Space, Button, message } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm/SchemaForm';
import { ISchema } from '@formily/react';

const { TabPane } = Tabs;

const SchemaFormDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');

  // 基础表单 Schema
  const basicSchema: ISchema = {
    type: 'object',
    properties: {
      grid: {
        type: 'void',
        'x-component': 'FormGrid',
        'x-component-props': {
          minColumns: [2, 3, 4],
          maxColumns: [2, 3, 4],
          columnGap: 20,
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
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-validator': 'email',
          },
          phone: {
            type: 'string',
            title: '手机号',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-validator': 'phone',
          },
          age: {
            type: 'number',
            title: '年龄',
            'x-decorator': 'FormItem',
            'x-component': 'NumberPicker',
            'x-component-props': {
              min: 0,
              max: 120,
            },
          },
          gender: {
            type: 'string',
            title: '性别',
            enum: [
              { label: '男', value: 'male' },
              { label: '女', value: 'female' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Select',
          },
          birthday: {
            type: 'string',
            title: '出生日期',
            'x-decorator': 'FormItem',
            'x-component': 'DatePicker',
          },
          address: {
            type: 'string',
            title: '地址',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              rows: 3,
            },
          },
          isActive: {
            type: 'boolean',
            title: '是否激活',
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
          },
        },
      },
    },
  };

  // 数组表格 Schema
  const arrayTableSchema: ISchema = {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        title: '用户列表',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayTable',
        'x-component-props': {
          pagination: { pageSize: 10 },
          scroll: { x: '100%' },
        },
        items: {
          type: 'object',
          properties: {
            column1: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': {
                title: '姓名',
                dataIndex: 'name',
                width: 200,
              },
              properties: {
                name: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  required: true,
                },
              },
            },
            column2: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': {
                title: '年龄',
                dataIndex: 'age',
                width: 100,
              },
              properties: {
                age: {
                  type: 'number',
                  'x-decorator': 'FormItem',
                  'x-component': 'NumberPicker',
                  'x-component-props': {
                    min: 0,
                    max: 120,
                  },
                },
              },
            },
            column3: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': {
                title: '邮箱',
                dataIndex: 'email',
                width: 200,
              },
              properties: {
                email: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-validator': 'email',
                },
              },
            },
            operations: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': {
                title: '操作',
                dataIndex: 'operations',
                width: 200,
                fixed: 'right',
              },
              properties: {
                item: {
                  type: 'void',
                  'x-component': 'ArrayTable.Remove',
                  'x-component-props': {
                    title: '删除',
                  },
                },
                moveUp: {
                  type: 'void',
                  'x-component': 'ArrayTable.MoveUp',
                  'x-component-props': {
                    title: '上移',
                  },
                },
                moveDown: {
                  type: 'void',
                  'x-component': 'ArrayTable.MoveDown',
                  'x-component-props': {
                    title: '下移',
                  },
                },
              },
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            'x-component': 'ArrayTable.Addition',
            'x-component-props': {
              title: '添加条目',
            },
          },
        },
      },
    },
  };

  // 响应式表单 Schema
  const reactiveSchema: ISchema = {
    type: 'object',
    properties: {
      grid: {
        type: 'void',
        'x-component': 'FormGrid',
        'x-component-props': {
          minColumns: [2, 3, 4],
        },
        properties: {
          userType: {
            type: 'string',
            title: '用户类型',
            enum: [
              { label: '个人用户', value: 'personal' },
              { label: '企业用户', value: 'enterprise' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          name: {
            type: 'string',
            title: '姓名',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-reactions': {
              dependencies: ['userType'],
              fulfill: {
                state: {
                  title: '{{$deps[0] === "enterprise" ? "企业名称" : "姓名"}}',
                },
              },
            },
          },
          idCard: {
            type: 'string',
            title: '身份证号',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-reactions': {
              dependencies: ['userType'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "personal"}}',
                },
              },
            },
          },
          businessLicense: {
            type: 'string',
            title: '营业执照号',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-reactions': {
              dependencies: ['userType'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "enterprise"}}',
                },
              },
            },
          },
          contactPerson: {
            type: 'string',
            title: '联系人',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-reactions': {
              dependencies: ['userType'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "enterprise"}}',
                },
              },
            },
          },
        },
      },
    },
  };

  // 复杂表单 Schema
  const complexSchema: ISchema = {
    type: 'object',
    properties: {
      tabs: {
        type: 'void',
        'x-component': 'FormTab',
        properties: {
          basic: {
            type: 'void',
            'x-component': 'FormTab.TabPane',
            'x-component-props': {
              tab: '基本信息',
            },
            properties: {
              basicGrid: {
                type: 'void',
                'x-component': 'FormGrid',
                'x-component-props': {
                  minColumns: [2, 3, 4],
                },
                properties: {
                  name: {
                    type: 'string',
                    title: '姓名',
                    required: true,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                  },
                  email: {
                    type: 'string',
                    title: '邮箱',
                    required: true,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-validator': 'email',
                  },
                  phone: {
                    type: 'string',
                    title: '手机号',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                  },
                  department: {
                    type: 'string',
                    title: '部门',
                    enum: [
                      { label: '技术部', value: 'tech' },
                      { label: '产品部', value: 'product' },
                      { label: '运营部', value: 'operation' },
                    ],
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
                  },
                },
              },
            },
          },
          advanced: {
            type: 'void',
            'x-component': 'FormTab.TabPane',
            'x-component-props': {
              tab: '高级设置',
            },
            properties: {
              collapse: {
                type: 'void',
                'x-component': 'FormCollapse',
                properties: {
                  permissions: {
                    type: 'void',
                    'x-component': 'FormCollapse.CollapsePanel',
                    'x-component-props': {
                      header: '权限设置',
                    },
                    properties: {
                      roles: {
                        type: 'array',
                        title: '角色',
                        enum: [
                          { label: '管理员', value: 'admin' },
                          { label: '编辑者', value: 'editor' },
                          { label: '查看者', value: 'viewer' },
                        ],
                        'x-decorator': 'FormItem',
                        'x-component': 'Checkbox.Group',
                      },
                      isActive: {
                        type: 'boolean',
                        title: '启用账户',
                        'x-decorator': 'FormItem',
                        'x-component': 'Switch',
                      },
                    },
                  },
                  settings: {
                    type: 'void',
                    'x-component': 'FormCollapse.CollapsePanel',
                    'x-component-props': {
                      header: '个人设置',
                    },
                    properties: {
                      theme: {
                        type: 'string',
                        title: '主题',
                        enum: [
                          { label: '浅色', value: 'light' },
                          { label: '深色', value: 'dark' },
                          { label: '自动', value: 'auto' },
                        ],
                        'x-decorator': 'FormItem',
                        'x-component': 'Radio.Group',
                      },
                      notifications: {
                        type: 'boolean',
                        title: '接收通知',
                        'x-decorator': 'FormItem',
                        'x-component': 'Switch',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const handleSubmit = (values: any) => {
    console.log('表单数据:', values);
    message.success('提交成功!');
  };

  const handleReset = () => {
    message.info('表单已重置');
  };

  return (
    <PageContainer
      title="SchemaForm 组件演示"
      content="基于 Formily 和 Ant Design v5 的通用表单组件，通过 JSON Schema 快速生成表单页面。"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="基础表单" key="basic">
          <Card title="基础表单示例" style={{ marginBottom: 24 }}>
            <SchemaForm
              schema={basicSchema}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          </Card>
        </TabPane>

        <TabPane tab="数组表格" key="array">
          <Card title="数组表格示例" style={{ marginBottom: 24 }}>
            <SchemaForm
              schema={arrayTableSchema}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          </Card>
        </TabPane>

        <TabPane tab="响应式表单" key="reactive">
          <Card title="响应式表单示例" style={{ marginBottom: 24 }}>
            <p style={{ marginBottom: 16, color: '#666' }}>
              根据用户类型显示不同的字段，演示字段联动效果
            </p>
            <SchemaForm
              schema={reactiveSchema}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          </Card>
        </TabPane>

        <TabPane tab="复杂表单" key="complex">
          <Card title="复杂表单示例" style={{ marginBottom: 24 }}>
            <p style={{ marginBottom: 16, color: '#666' }}>
              包含标签页和折叠面板的复杂表单结构
            </p>
            <SchemaForm
              schema={complexSchema}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          </Card>
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default SchemaFormDemo;