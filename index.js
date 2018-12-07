const request = require('request-promise-native')
const args = require('commander')
const async = require('async')
const _ = require('lodash')

const github = require('./lib/util/github')
const ua = require('./lib/util/useragent')
const pdf = require('./lib/util/pdf')
const USER_AGENT = ua.getUserAgent()
const packageInfo = require('./package.json')
const { sanitizeText } = require('./lib/util/text')

log(`${packageInfo.name} v${packageInfo.version}`)

args
  .version(packageInfo.version)
  .option('-t, --token [github_api_token]', 'Your GitHub API token', process.env.GITHUB_API_TOKEN)
  .option('-o, --owner [repo_owner]', 'The GitHub repo owner - username or org name', process.env.REPO_OWNER)
  .option('-r, --repo [repo_name]', 'The GitHub repo name', process.env.REPO_NAME)
  .option('-m, --milestone [number]', 'Repo milestone number filter (from the GitHub URL)', process.env.REPO_MILESTONE)
  .option('-l, --labels [label_list]', 'Comma-separated list of labels to filter on', process.env.REPO_LABELS)
  .option('-i, --issues [issue_nums]', 'Comma-separated list of issue numbers to include', process.env.REPO_ISSUES)
  .option('--project-column [url]', 'URL of GitHub project column to be printed', process.env.PROJECT_COLUMN_URL)
  .parse(process.argv)

// verify that we have enough info to do something useful
if (!args.token) {
  console.error()
  console.error('Error: Missing GitHub API token!')
  args.help() // this automatically exits
}
if ((_.isEmpty(args.repo) || _.isEmpty(args.owner)) && _.isEmpty(args.projectColumn)) {
  args.help() // this automatically exits
}

let URL
if (args.projectColumn) {
  processProjectColumnUrl(args.token, args.projectColumn)
} else if (args) {
  processIssuesList()
} else {
  processIssuesByQuery()
}

function processIssuesList () {
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
}

function processIssuesByQuery() {
  URL = github.getGitHubIssuesQueryUrl(args)
  getIssuesJson(URL, (err, responseBody) => {
    if (err) {
      log(err)
      process.exit(1)
    }
    processIssuesJson(responseBody)
  })
}

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

async function processProjectColumnUrl (bearerToken, url) {
  let columnId = url.split("#column-")[1]
  let cardsUrl = `https://api.github.com/projects/columns/${columnId}/cards`
  let cardsBody = await _httpGet(bearerToken, cardsUrl, {'accept': 'application/vnd.github.inertia-preview+json'})

  let cards = []
  for (card of cardsBody) {
    if (card.note) {
      cards.push({title: sanitizeText(card.note)})
    } else if (card.content_url) {
      let cardContent = await _httpGet(bearerToken, card.content_url)
      cards.push({
        number: cardContent.number,
        title: sanitizeText(cardContent.title),
        repo: cardContent.repository_url.substring(cardContent.repository_url.lastIndexOf("/")+1),
        body: sanitizeText(cardContent.body)
      })
    }
  }

  pdf.createPdf(cards, {renderBody: args.body})
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
    let issueData = {
      number: issue.number,
      title: sanitizeText(issue.title),
      repo: repoName,
      body: sanitizeText(issue.body)
    }
    newIssues.push(issueData)
  })

  pdf.createPdf(newIssues, {renderBody: args.body})
}

function log (msg) {
  console.error(msg)
}

