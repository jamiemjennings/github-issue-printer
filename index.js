const request = require('request')
const args = require('commander')
const removeMd = require('remove-markdown')
const async = require('async')
const _ = require('lodash')

const github = require('./lib/util/github')
const ua = require('./lib/util/useragent')
const pdf = require('./lib/util/pdf')
const USER_AGENT = ua.getUserAgent()
const packageInfo = require('./package.json')
const emojiStrip = require('emoji-strip')

log(`${packageInfo.name} v${packageInfo.version}`)

args
  .version(packageInfo.version)
  .option('-t, --token [github_api_token]', 'Your GitHub API token', process.env.GITHUB_API_TOKEN)
  .option('-o, --owner [repo_owner]', 'The GitHub repo owner - username or org name', process.env.REPO_OWNER)
  .option('-r, --repo [repo_name]', 'The GitHub repo name', process.env.REPO_NAME)
  .option('-m, --milestone [number]', 'Repo milestone number filter (from the GitHub URL)', process.env.REPO_MILESTONE)
  .option('-l, --labels [label_list]', 'Comma-separated list of labels to filter on', process.env.REPO_LABELS)
  .option('-i, --issues [issue_nums]', 'Comma-separated list of issue numbers to include', process.env.REPO_ISSUES)
  .option('--no-body', 'Excludes the Issue body text')
  .parse(process.argv)

if (!args.token) {
  throw new Error('Error: Missing GitHub API token!')
}
if (!args.owner) {
  throw new Error('Missing GitHub repo owner!')
}
if (!args.repo) {
  throw new Error('Missing GitHub repo name!')
}

let URL
if (args.issues) {
  let issuesJson = []
  async.each(args.issues.split(','), (issueNum, asyncCb) => {
    URL = github.getGitHubIssueUrl(_.merge(args, { issueNum }))
    getIssuesJson(URL, (err, responseBody) => {
      if (err) {
        return asyncCb(err)
      }
      issuesJson.push(responseBody)
      asyncCb()
    })
  }, (err) => {
    if (err) {
      log(err)
      process.exit(1)
    }
    processIssuesJson(issuesJson)
  })
} else {
  URL = github.getGitHubIssuesQueryUrl(args)
  getIssuesJson(URL, (err, responseBody) => {
    if (err) {
      log(err)
      process.exit(1)
    }
    processIssuesJson(responseBody)
  })
}

function getIssuesJson (URL, callback) {
  log(`> GET ${URL}`)
  request({
    method: 'GET',
    uri: URL,
    json: true,
    headers: {
      authorization: `token ${args.token}`,
      'user-agent': USER_AGENT
    }
  },
  (err, res, body) => {
    log(`< ${res.statusCode}`)
    if (err) {
      log(err)
      throw err
    }
    if (res.statusCode === 403) {
      log('Error: Authentication failed')
      log(body)
      process.exit(1)
    } else if (res.statusCode === 422) {
      log(`Error 422: check that your filter selection is valid for this repository.`)
      log(body)
      process.exit(1)
    } else if (res.statusCode !== 200) {
      log(`Error: unexpected status: ${res.statusCode}`)
      log(body)
      process.exit(1)
    }
    callback(null, body)
  })
}

function processIssuesJson (issues) {
  const newIssues = []
  if (!issues || issues.length === 0) {
    throw new Error('Error: no issues found.')
  }
  log(`${issues.length} issues retrieved.`)
  issues.forEach((issue) => {
    let repoName = args.repo
    let issueBody = issue.body
    issueBody = issueBody.replace(/\r/g, '') // pdfkit doesn't handle \r properly (\n is ok)
    issueBody = removeMd(issueBody, { stripListLeaders: false })
    let issueData = {
      number: issue.number,
      title: emojiStrip(issue.title).trim(),
      repo: repoName,
      body: emojiStrip(issueBody).trim()
    }
    newIssues.push(issueData)
  })

  pdf.createPdf(newIssues, {renderBody: args.body})
}

function log (msg) {
  console.error(msg)
}
