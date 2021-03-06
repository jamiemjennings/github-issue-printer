const request = require('request')
const args = require('commander')
const async = require('async')
const _ = require('lodash')

const github = require('./lib/util/github')
const pdf = require('./lib/util/pdf')
const ua = require('./lib/util/useragent')
const USER_AGENT = ua.getUserAgent()
const packageInfo = require('./package.json')
const { sanitizeText } = require('./lib/util/text')
const HttpUtil = require('./lib/util/http')
const log = require('./lib/util/logger')

log(`${packageInfo.name} v${packageInfo.version}`)

const httpUtil = new HttpUtil()

const POINTS_LABELS = [
  'XS', 'S', 'M', 'L', 'XL',
  '0', '1/2', '1', '2', '3', '5', '8', '13', '21'
]

args
  .version(packageInfo.version)
  .option('-t, --token [github_api_token]', 'Your GitHub API token', process.env.GITHUB_API_TOKEN)
  .option('-o, --owner [repo_owner]', 'The GitHub repo owner - username or org name', process.env.REPO_OWNER)
  .option('-r, --repo [repo_name]', 'The GitHub repo name', process.env.REPO_NAME)
  .option('-m, --milestone [number]', 'Repo milestone number filter (from the GitHub URL)', process.env.REPO_MILESTONE)
  .option('-l, --labels [label_list]', 'Comma-separated list of labels to filter on', process.env.REPO_LABELS)
  .option('-i, --issues [issue_nums]', 'Comma-separated list of issue numbers to include', process.env.REPO_ISSUES)
  .option('-p, --points', 'Flag to enable the points label on cards')
  .option('--project-column [url]', 'URL of GitHub project column to be printed', process.env.PROJECT_COLUMN_URL)
  .parse(process.argv)

// flag options can't have "values" so do the environment variable setting here
if (process.env.INCLUDE_POINTS_LABELS) {
  args.points = true
}

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
  // call async function from main without promise warnings
  // https://stackoverflow.com/questions/46515764/how-can-i-use-async-await-at-the-top-level
  (async () => {
    try {
      await processProjectColumnUrl(args.token, args.projectColumn)
    } catch (err) {
      console.log('ERROR:')
      console.log(err)
      process.exit(1)
    }
  })()
} else if (args.issues) {
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

function processIssuesByQuery () {
  URL = github.getGitHubIssuesQueryUrl(args)
  getIssuesJson(URL, (err, responseBody) => {
    if (err) {
      log(err)
      process.exit(1)
    }
    processIssuesJson(responseBody)
  })
}

async function processProjectColumnUrl (bearerToken, url) {
  let columnId = url.split('#column-')[1]
  let cardsUrl = `https://api.github.com/projects/columns/${columnId}/cards`
  let cardsBody = await httpUtil.httpGet(bearerToken, cardsUrl, { 'accept': 'application/vnd.github.inertia-preview+json' }
  ).catch((err) => {
    throw err
  })

  let cards = []
  for (card of cardsBody) {
    if (card.note) {
      cards.push({ title: sanitizeText(card.note) })
    } else if (card.content_url) {
      let cardContent = await httpUtil.httpGet(bearerToken, card.content_url).catch((err) => { throw err })
      cards.push({
        number: cardContent.number,
        title: sanitizeText(cardContent.title),
        repo: cardContent.repository_url.substring(cardContent.repository_url.lastIndexOf('/') + 1),
        body: sanitizeText(cardContent.body),
        pointsLabel: cardContent.labels.find((label) => POINTS_LABELS.includes(label.name))
      })
    }
  }
  pdf.createPdf(cards, { renderBody: args.body, renderPointsLabels: args.points })
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

  pdf.createPdf(newIssues, { renderBody: args.body })
}
