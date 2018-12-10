/* eslint-env node, mocha */
const { assert } = require('chai')
const HttpUtil = require.main.require('lib/util/http')
const sinon = require('sinon')
const request = require('request-promise-native')

let emptyMockLogger = { log () {} }

describe('HTTP util', function () {
  let transport = new HttpUtil({ logger: emptyMockLogger, request: request })
  let _transport = sinon.mock(transport)

  it('constructor sets a default request if not provided', () => {
    let instance = new HttpUtil()
    assert.exists(instance.request)
  })
  it('constructor sets a default logger if not provided', () => {
    let instance = new HttpUtil()
    assert.exists(instance.logger)
    assert.isFunction(instance.logger.log)
  })
  it('uses custom request if supplied to constructor', () => {
    let called = false
    let request = () => { called = true }
    let instance = new HttpUtil({ request })
    assert.isFalse(called)
    instance.request({})
    assert.isTrue(called)
  })
  it('uses custom logger if supplied to constructor', () => {
    let called = false
    let logger = { log () { called = true } }
    let instance = new HttpUtil({ logger })
    assert.isFalse(called)
    instance.logger.log('foo')
    assert.isTrue(called)
  })
  it('throws error if no uri is supplied', async () => {
    try {
      await transport.httpGet({ uri: undefined })
      assert.isTrue(false, `Expected error was not thrown`)
    } catch (err) {}
  })
  it('returns body on successful request', async () => {
    try {
      _transport.expects('request').resolves({ statusCode: 200, body: { foo: 'bar' } })
      let body = await transport.httpGet('', 'https://0.0.0.0/foobar')
      assert.deepEqual(body, { foo: 'bar' })
    } catch (err) {
      assert.isTrue(false, `Unexpected error occurred: ${err}`)
    }
  })
  it('throws error if request statusCode > 200', async () => {
    try {
      _transport.expects('request').resolves({ statusCode: 401, body: 'Unauthorized' })
      await transport.httpGet('', 'https://0.0.0.0/foobar')
      assert.isTrue(false, `Expected error was not thrown`)
    } catch (err) {
      assert.equal(err.message, 'Unauthorized')
    }
  })
  it('throws error if request statusCode > 200', async () => {
    let errBody = { code: 'ERR-500', message: 'Internal Server Error' }
    try {
      _transport.expects('request').resolves({ statusCode: 500, body: errBody })
      await transport.httpGet('', 'https://0.0.0.0/foobar')
      assert.isTrue(false, `Expected error was not thrown`)
    } catch (err) {
      assert.deepEqual(err.message, JSON.stringify(errBody))
    }
  })
})
