const ua = require.main.require('lib/util/useragent')
const { assert } = require('chai')

describe('useragent lib', function () {
  it('returns a useragent string', () => {
    let userAgent = ua.getUserAgent()
    assert.isNotEmpty(userAgent)
    assert.isString(userAgent)
  })
})