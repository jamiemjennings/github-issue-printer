const querystring = require('querystring')

module.exports = {
 getGitHubIssuesUrl: function (options) {
        const query = {}
        if (options.milestone) {
            query.milestone = options.milestone
        }
        if (options.labels) {
            query.labels = options.labels
        }
        return `https://api.github.com/repos/${options.owner}/${options.repo}/issues?${querystring.stringify(query)}`
    }
}