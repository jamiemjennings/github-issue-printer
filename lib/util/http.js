const _ = require('lodash')
const request = require('request-promise-native')
const log = require('./logger')
const ua = require('./useragent')
const USER_AGENT = ua.getUserAgent()

async function _httpGet (bearerToken, url, customHeaders = {}) {
  log(`> GET ${url}`)
  let res = await request({
    method: 'GET',
    url: url,
    json: true,
    resolveWithFullResponse: true,
    headers: _.merge({
      authorization: `token ${bearerToken}`,
      'user-agent': USER_AGENT
    }, customHeaders)
  })
  log(`< ${res.statusCode}`)
  if (res.err) {
    log(res.err)
    throw res.err
  }
  if (res.statusCode === 403) {
    log('Error: Authentication failed')
    log(res.body)
    process.exit(1)
  } else if (res.statusCode === 422) {
    log(`Error 422: check that your filter selection is valid for this repository.`)
    log(res.body)
    process.exit(1)
  } else if (res.statusCode !== 200) {
    log(`Error: unexpected status: ${res.statusCode}`)
    log(res.body)
    process.exit(1)
  }
  return res.body
}

module.exports = {
  _httpGet
}