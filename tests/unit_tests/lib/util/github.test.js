/* eslint-env node, mocha */
const assert = require('chai').assert
const github = require.main.require('lib/util/github')

describe('GitHub util', function () {
  var invalidOptionsTests = [
    { options: undefined },
    { options: null },
    { options: {} },
    { options: { a: 'b' } },
    { options: [] }
  ]
  describe('getGitHubIssuesQueryUrl()', function () {
    invalidOptionsTests.forEach((testData) => {
      it(`throws error if options is ${JSON.stringify(testData.options)}`, (done) => {
        try {
          github.getGitHubIssuesQueryUrl(testData.options)
        } catch (err) {
          assert.isNotNull(err)
          done()
        }
      })
    })
  })
  describe('getGitHubIssueUrl()', function () {
    invalidOptionsTests.forEach((testData) => {
      it(`throws error if options is ${JSON.stringify(testData.options)}`, (done) => {
        try {
          github.getGitHubIssueUrl(testData.options)
        } catch (err) {
          assert.isNotNull(err)
          done()
        }
      })
    })
  })
})
