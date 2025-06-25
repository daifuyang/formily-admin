import { test } from 'node:test'
import assert from 'node:assert'
import { build } from './helper'

test('Form Definition API', async (t) => {
  const app = await build(t)
  
  await t.test('should create a form definition', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/form-definitions',
      payload: {
        formId: 'test-form',
        name: 'Test Form',
        description: 'A test form',
        schema: {
          type: 'object',
          properties: {
            name: {
              name: 'name',
              type: 'Input',
              title: 'Name',
              required: true
            }
          }
        }
      }
    })
    
    assert.strictEqual(response.statusCode, 201)
    const result = JSON.parse(response.payload)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.data.formId, 'test-form')
  })
  
  await t.test('should get form definition by formId', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/form-definitions/test-form'
    })
    
    assert.strictEqual(response.statusCode, 200)
    const result = JSON.parse(response.payload)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.data.formId, 'test-form')
  })
  
  await t.test('should get form definitions list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/form-definitions'
    })
    
    assert.strictEqual(response.statusCode, 200)
    const result = JSON.parse(response.payload)
    assert.strictEqual(result.success, true)
    assert.ok(Array.isArray(result.data.data))
  })
  
  await t.test('should update form definition', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/form-definitions/test-form',
      payload: {
        name: 'Updated Test Form',
        description: 'An updated test form'
      }
    })
    
    assert.strictEqual(response.statusCode, 200)
    const result = JSON.parse(response.payload)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.data.name, 'Updated Test Form')
  })
})

test('Form Instance API', async (t) => {
  const app = await build(t)
  
  // First create a form definition
  await app.inject({
    method: 'POST',
    url: '/form-definitions',
    payload: {
      formId: 'instance-test-form',
      name: 'Instance Test Form',
      schema: {
        type: 'object',
        properties: {
          name: {
            name: 'name',
            type: 'Input',
            title: 'Name',
            required: true
          },
          email: {
            name: 'email',
            type: 'Input',
            title: 'Email'
          }
        }
      }
    }
  })
  
  await t.test('should create a form instance', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/form-instances',
      payload: {
        formId: 'instance-test-form',
        data: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    })
    
    assert.strictEqual(response.statusCode, 201)
    const result = JSON.parse(response.payload)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.data.formId, 'instance-test-form')
    assert.strictEqual(result.data.data.name, 'John Doe')
  })
  
  await t.test('should search form instances', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/form-instances?formId=instance-test-form'
    })
    
    assert.strictEqual(response.statusCode, 200)
    const result = JSON.parse(response.payload)
    assert.strictEqual(result.success, true)
    assert.ok(Array.isArray(result.data.data))
    assert.ok(result.data.data.length > 0)
  })
  
  await t.test('should get form instance stats', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/form-instances/stats?formId=instance-test-form'
    })
    
    assert.strictEqual(response.statusCode, 200)
    const result = JSON.parse(response.payload)
    assert.strictEqual(result.success, true)
    assert.ok(typeof result.data.total === 'number')
    assert.ok(typeof result.data.draft === 'number')
  })
})