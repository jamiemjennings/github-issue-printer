const request = require('request')
const fs = require('fs')
const args = require('commander')
const removeMd = require('remove-markdown')
const os = require('os')

const github = require('./lib/util/github')
const ua = require('./lib/util/useragent')
const pdf = require('./lib/util/pdf')
const USER_AGENT = ua.getUserAgent()
const packageInfo = require('./package.json')

log(`${packageInfo.name} v${packageInfo.version}`)

args
    .version(packageInfo.version)
    .option('-t, --token [github_api_token]', 'Your GitHub API token', process.env.GITHUB_API_TOKEN)
    .option('-o, --owner [repo_owner]', 'The GitHub repo owner - username or org name', process.env.REPO_OWNER)
    .option('-r, --repo [repo_name]', 'The GitHub repo name', process.env.REPO_NAME)
    .option('-m, --milestone [number]', '(Optional) repo milestone number filter (from the GitHub URL)', process.env.REPO_MILESTONE)
    .option('-l, --labels [label_list]', 'Comma-separated list of labels to filter on', process.env.REPO_LABELS)
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

const URL = github.getGitHubIssuesUrl(args)

log(`> GET ${URL}`)
request({
    method: 'GET',
    uri: URL,
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
    processIssuesJson(body)
})

function processIssuesJson(json) {
    const issues = JSON.parse(json)
    const newIssues = []

    if (!issues || issues.length === 0) {
        throw new Error('Error: no issues found.')
    }
    log(`${issues.length} issues retrieved.`)
    issues.forEach((issue) => {
        let issueNum = `#${issue.number}`
        let cardTitle = issue.title
        let repoName = args.repo
        let issueBody = issue.body
        issueBody = issueBody.replace(/\r/g, '') // pdfkit doesn't handle \r properly (\n is ok)
        issueBody = removeMd(issueBody, { stripListLeaders: false })
        let issueData = {
            number: issue.number,
            title: issue.title,
            repo: repoName,
            body: issueBody
        }
        newIssues.push(issueData)
    })

    pdf.createPdf(newIssues, {renderBody: args.body})
}

function log(msg) {
    console.error(msg)
}