const querystring = require('querystring')

const GITHUB_BASE_URI = 'https://api.github.com/'

function _validateRequiredOptions (options) {
  if (!options || !options.owner) {
    throw new Error('Repo owner not specified!')
  }
  if (!options || !options.repo) {
    throw new Error('Repo name not specified!')
  }
}

module.exports = {
  getGitHubIssuesQueryUrl: function (options) {
    _validateRequiredOptions(options)
    const query = {}
    if (options.milestone) {
      query.milestone = options.milestone
    }
    if (options.labels) {
      query.labels = options.labels
    }
    return `${GITHUB_BASE_URI}repos/${options.owner}/${options.repo}/issues?${querystring.stringify(query)}`
  },

  getGitHubIssueUrl: function (options) {
    _validateRequiredOptions(options)
    if (!options || !options.issueNum) {
      throw new Error('Issue number not specified!')
    }
    return `${GITHUB_BASE_URI}repos/${options.owner}/${options.repo}/issues/${options.issueNum}`
  }
}
