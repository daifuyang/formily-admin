import { ISchema } from '@formily/react';

export const hospitalSchema: ISchema = {
  type: 'object',
  properties: {
    basicInfo: {
      type: 'void',
      'x-component': 'FormGrid',
      'x-component-props': {
        minColumns: 2,
        maxColumns: 2,
      },
      properties: {
        username: {
          type: 'string',
          title: '用户名',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': [
            {
              required: true,
              message: '请输入用户名'
            }
          ]
        },
        password: {
          type: 'string',
          title: '密码',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input.Password',
          'x-validator': [
            {
              required: true,
              message: '请输入密码'
            },
            {
              min: 6,
              message: '密码长度不能少于6位'
            }
          ]
        },
        hospitalName: {
          type: 'string',
          title: '医院名称',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': {
            required: true,
            message: '请输入医院名称'
          }
        },
        email: {
          type: 'string',
          title: '绑定推送邮箱',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': [
            {
              required: true,
              message: '请输入邮箱'
            },
            {
              format: 'email',
              message: '邮箱格式不正确'
            }
          ]
        },
        address: {
          type: 'array',
          title: '医院地址',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Cascader',
          'x-component-props': {
            placeholder: '请选择省市区',
            changeOnSelect: true
          },
          'x-validator': {
            required: true,
            message: '请选择省市区'
          }
        },
        detailAddress: {
          type: 'string',
          title: '详细地址',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          'x-validator': {
            required: true,
            message: '请输入详细地址'
          }
        }
      }
    },
    contactInfo: {
      type: 'void',
      title: '联系方式',
      'x-component': 'FormGrid',
      'x-component-props': {
        minColumns: 2,
        maxColumns: 2,
      },
      properties: {
        phone: {
          type: 'string',
          title: '咨询电话',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': {
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入正确的手机号码'
          }
        },
        website: {
          type: 'string',
          title: '医院网址',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': {
            format: 'url',
            message: '请输入正确的网址'
          }
        },
        hospitalType: {
          type: 'string',
          title: '医院性质',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '公立医院', value: 'public' },
            { label: '民营医院', value: 'private' }
          ]
        }
      }
    }
    // 其他字段组可以按照相同模式继续添加
  }
};
