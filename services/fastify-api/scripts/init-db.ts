import mongoose from 'mongoose'
import { FormDefinitionModel } from '../src/models/form'
import { FormDefinition } from '../src/types/form'

// 示例表单定义
const sampleFormDefinitions: Partial<FormDefinition>[] = [
  {
    formId: 'user-registration',
    name: '用户注册表单',
    description: '用户注册信息收集表单',
    schema: {
      type: 'object',
      properties: {
        username: {
          name: 'username',
          type: 'Input',
          title: '用户名',
          required: true,
          'x-component-props': {
            placeholder: '请输入用户名'
          }
        },
        email: {
          name: 'email',
          type: 'Input',
          title: '邮箱',
          required: true,
          'x-component-props': {
            placeholder: '请输入邮箱地址'
          },
          'x-validator': 'email'
        },
        phone: {
          name: 'phone',
          type: 'Input',
          title: '手机号',
          required: true,
          'x-component-props': {
            placeholder: '请输入手机号'
          }
        },
        gender: {
          name: 'gender',
          type: 'Radio',
          title: '性别',
          enum: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' }
          ]
        },
        birthday: {
          name: 'birthday',
          type: 'DatePicker',
          title: '生日',
          'x-component-props': {
            placeholder: '请选择生日'
          }
        },
        interests: {
          name: 'interests',
          type: 'Checkbox',
          title: '兴趣爱好',
          enum: [
            { label: '阅读', value: 'reading' },
            { label: '运动', value: 'sports' },
            { label: '音乐', value: 'music' },
            { label: '旅行', value: 'travel' }
          ]
        },
        bio: {
          name: 'bio',
          type: 'TextArea',
          title: '个人简介',
          'x-component-props': {
            placeholder: '请输入个人简介',
            rows: 4
          }
        }
      }
    },
    status: 'published',
    createdBy: 'system'
  },
  {
    formId: 'feedback-form',
    name: '意见反馈表单',
    description: '用户意见反馈收集表单',
    schema: {
      type: 'object',
      properties: {
        title: {
          name: 'title',
          type: 'Input',
          title: '反馈标题',
          required: true,
          'x-component-props': {
            placeholder: '请输入反馈标题'
          }
        },
        category: {
          name: 'category',
          type: 'Select',
          title: '反馈类型',
          required: true,
          enum: [
            { label: '功能建议', value: 'feature' },
            { label: 'Bug反馈', value: 'bug' },
            { label: '使用问题', value: 'usage' },
            { label: '其他', value: 'other' }
          ]
        },
        priority: {
          name: 'priority',
          type: 'Radio',
          title: '优先级',
          enum: [
            { label: '低', value: 'low' },
            { label: '中', value: 'medium' },
            { label: '高', value: 'high' }
          ],
          default: 'medium'
        },
        description: {
          name: 'description',
          type: 'TextArea',
          title: '详细描述',
          required: true,
          'x-component-props': {
            placeholder: '请详细描述您的反馈内容',
            rows: 6
          }
        },
        rating: {
          name: 'rating',
          type: 'Rate',
          title: '满意度评分',
          'x-component-props': {
            allowHalf: true
          }
        },
        contact: {
          name: 'contact',
          type: 'Input',
          title: '联系方式',
          'x-component-props': {
            placeholder: '请输入您的联系方式（可选）'
          }
        }
      }
    },
    status: 'published',
    createdBy: 'system'
  },
  {
    formId: 'survey-form',
    name: '问卷调查表单',
    description: '用户满意度调查问卷',
    schema: {
      type: 'object',
      properties: {
        q1: {
          name: 'q1',
          type: 'Radio',
          title: '您对我们的产品整体满意度如何？',
          required: true,
          enum: [
            { label: '非常满意', value: 5 },
            { label: '满意', value: 4 },
            { label: '一般', value: 3 },
            { label: '不满意', value: 2 },
            { label: '非常不满意', value: 1 }
          ]
        },
        q2: {
          name: 'q2',
          type: 'Checkbox',
          title: '您最常使用哪些功能？（多选）',
          enum: [
            { label: '表单设计', value: 'form-design' },
            { label: '数据管理', value: 'data-management' },
            { label: '报表分析', value: 'analytics' },
            { label: '用户管理', value: 'user-management' }
          ]
        },
        q3: {
          name: 'q3',
          type: 'Slider',
          title: '您认为产品的易用性如何？（1-10分）',
          'x-component-props': {
            min: 1,
            max: 10,
            marks: {
              1: '很难用',
              5: '一般',
              10: '很好用'
            }
          }
        },
        q4: {
          name: 'q4',
          type: 'TextArea',
          title: '您希望我们增加哪些新功能？',
          'x-component-props': {
            placeholder: '请描述您希望的新功能',
            rows: 4
          }
        },
        recommend: {
          name: 'recommend',
          type: 'Switch',
          title: '您是否愿意向朋友推荐我们的产品？'
        }
      }
    },
    status: 'published',
    createdBy: 'system'
  }
]

async function initDatabase() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/formily-admin'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')
    
    // 清空现有数据（可选）
    await FormDefinitionModel.deleteMany({})
    console.log('Cleared existing form definitions')
    
    // 插入示例数据
    for (const formDef of sampleFormDefinitions) {
      const form = new FormDefinitionModel(formDef)
      await form.save()
      console.log(`Created form definition: ${form.name}`)
    }
    
    console.log('Database initialization completed successfully!')
  } catch (error) {
    console.error('Database initialization failed:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed')
  }
}

// 运行初始化
if (require.main === module) {
  initDatabase()
}

export { initDatabase }