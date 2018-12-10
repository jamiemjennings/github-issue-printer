const _ = require('lodash')
const request = require('request-promise-native')
const log = require('./logger')
const ua = require('./useragent')
const USER_AGENT = ua.getUserAgent()

class HttpUtil {
  constructor (options = {}) {
    this.request = options.request || request
    this.logger = options.logger || { log }
  }

  async httpGet (bearerToken, url, customHeaders = {}) {
    this.logger.log(`> GET ${url}`)
    let res
    res = await this.request({
      method: 'GET',
      url: url,
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      headers: _.merge({
        authorization: `token ${bearerToken}`,
        'user-agent': USER_AGENT
      }, customHeaders)
    }).catch((err) => {
      this.logger.log(`Error: ${err} on GET ${url}`)
      this.logger.log(err)
      throw err
    })

    this.logger.log(`< ${res.statusCode}`)
    if (res.statusCode !== 200) {
      this.logger.log(`Error: statusCode=${res.statusCode} on GET ${url}`)
      this.logger.log(res.body)
      throw new Error(_.isString(res.body) ? res.body : JSON.stringify(res.body))
    }
    return res.body
  }
}

module.exports = HttpUtil
