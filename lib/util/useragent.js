const os = require('os')
const packageInfo = require('../../package.json')
const osRelease = os.release()
const lang = process.release.name
const nodeVersion = process.version
const platform = process.platform

module.exports = {
  getUserAgent: function () {
    return `${packageInfo.name} v${packageInfo.version} (${lang} ${nodeVersion}; ${platform} ${osRelease})`
  }
}
