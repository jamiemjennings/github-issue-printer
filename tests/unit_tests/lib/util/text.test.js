/* eslint-env node, mocha */
const { sanitizeText } = require.main.require('lib/util/text')
const { assert } = require('chai')

describe('text utils', () => {
  let testCases = [
    { input: undefined, shouldThrowError: true },
    { input: null, shouldThrowError: true },
    { input: 0, shouldThrowError: true },
    { input: '', expected: '' },
    { input: 'null', expected: 'null' },
    { input: 'undefined', expected: 'undefined' },
    { input: {}, shouldThrowError: true },
    { input: 'test', expected: 'test' },
    { input: '*test*', expected: 'test' },
    { input: '**test**', expected: 'test' },
    { input: '  ### test', expected: 'test' },
    { input: 'te\r\nst', expected: 'te\nst' },
    { input: 'te😃st', expected: 'test' },
    { input: '    a😃🤣😝😼💬💥💯b ', expected: 'ab' }
  ]
  testCases.forEach((testCase) => {
    it(testCase.shouldThrowError
        ? `should throw error for ${testCase.input}`
        : `should return '${testCase.expected}' for '${testCase.input}'`,
        (done) => {
          try {
            let result = sanitizeText(testCase.input)
            assert.equal(result, testCase.expected)
            done()
          } catch (err) {
            if (!testCase.shouldThrowError) {
              throw err
            } else {
              done()
            }
          }
        })
  })
})
