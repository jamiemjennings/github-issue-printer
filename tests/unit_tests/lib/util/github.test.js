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
    it('succeeds if owner & repo is specified', () => {
      let url = github.getGitHubIssuesQueryUrl({owner: 'foobar', repo: 'fizzbuzz'})
      assert.equal(url, 'https://api.github.com/repos/foobar/fizzbuzz/issues?')
    })
    it('succeeds if owner & repo is specified with labels', () => {
      let url = github.getGitHubIssuesQueryUrl({owner: 'foobar', repo: 'fizzbuzz', labels: 'abc'})
      assert.equal(url, 'https://api.github.com/repos/foobar/fizzbuzz/issues?labels=abc')
    })
    it('succeeds if owner & repo is specified with milestone', () => {
      let url = github.getGitHubIssuesQueryUrl({owner: 'foobar', repo: 'fizzbuzz', milestone: 'foo'})
      assert.equal(url, 'https://api.github.com/repos/foobar/fizzbuzz/issues?milestone=foo')
    })
    it('succeeds if owner & repo is specified with labels & milestone', () => {
      let url = github.getGitHubIssuesQueryUrl({owner: 'foobar', repo: 'fizzbuzz', labels: 'abc,def', milestone: 'foo'})
      assert.equal(url, 'https://api.github.com/repos/foobar/fizzbuzz/issues?milestone=foo&labels=abc%2Cdef')
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
    it('succeeds if owner, repo & issueNum is specified', function () {
      let url = github.getGitHubIssueUrl({owner: 'foobar', repo: 'fizzbuzz', issueNum: '3'})
      assert.equal(url, 'https://api.github.com/repos/foobar/fizzbuzz/issues/3')
    })
  })
  describe('getGitHubProjectsUrl()', function () {
    invalidOptionsTests.forEach((testData) => {
      it(`throws error if options is ${JSON.stringify(testData.options)}`, (done) => {
        try {
          github.getGitHubProjectsUrl(testData.options)
        } catch (err) {
          assert.isNotNull(err)
          done()
        }
      })
    })
    it('succeeds if owner is specified', function () {
      let url = github.getGitHubProjectsUrl({owner: 'foobar'})
      assert.equal(url, 'https://api.github.com/orgs/foobar/projects?status=open')
    })
  })
})
