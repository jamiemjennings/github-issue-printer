const PDFKit = require('pdfkit')
const request = require('request')
const fs = require('fs')
const args = require('commander')
const removeMd = require('remove-markdown')
const querystring = require('querystring')

const os = require('os')
const packageInfo = require('./package.json')
const osRelease = os.release()
const lang = process.release.name
const nodeVersion = process.version
const platform = process.platform
const USER_AGENT = `${packageInfo.name} v${packageInfo.version} (${lang} ${nodeVersion}; ${platform} ${osRelease})`

console.error(`${packageInfo.name} v${packageInfo.version}`)

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

const query = {}
if (args.milestone) {
    query.milestone = args.milestone
}
if (args.labels) {
    query.labels = args.labels
}
const URL = `https://api.github.com/repos/${args.owner}/${args.repo}/issues?${querystring.stringify(query)}`

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
    console.error(`${issues.length} issues retrieved.`)
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

    createPdf(newIssues)
}

function createPdf(issues) {
    const pdfDoc = new PDFKit({ autoFirstPage: false })
    pdfDoc.pipe(process.stdout)

    issues.forEach((issue) => {
        pdfDoc.addPage({ 
            layout: 'landscape', 
            size: 'letter', // TODO support other paper sizes
            margins: {
                top: 50,
                left: 50,
                right: 50,
                bottom: 50
            }
        })
        let issueNum = `#${issue.number}`
        let cardTitle = issue.title
        let repoName = issue.repo

        let borderStartX = pdfDoc.page.margins.left - 15
        let borderStartY = pdfDoc.page.margins.top - 15
        let borderEndX = pdfDoc.page.width - borderStartX - pdfDoc.page.margins.right + 15
        let borderEndY = pdfDoc.page.maxY() - pdfDoc.page.margins.top + 15

        let headerBoxStartX = borderStartX
        let headerBoxEndX = borderEndX
        let headerBoxStartY = borderStartY
        let headerBoxEndY = pdfDoc.y + 7 // 7 magic number for extra padding

        // draw a light gray background for header with black outline
        pdfDoc.rect(headerBoxStartX, headerBoxStartY, headerBoxEndX, headerBoxEndY).fillOpacity(0.4).fillAndStroke('lightgray', 'black')

        // back to regular opacity for header text
        pdfDoc.fillOpacity(1.0).fill('black')
        pdfDoc.font('Helvetica').fontSize(36).text(`${issueNum}: ${repoName}`).moveDown() // header title
        pdfDoc.font('Helvetica').fontSize(72).lineGap(1).text(cardTitle) // main text
        pdfDoc.fontSize(8).moveDown()
        if (args.body) {
            pdfDoc.font('Helvetica').fontSize(32).text(issue.body, {height: 250, ellipsis: '...'})
        }
        pdfDoc.rect(borderStartX, borderStartY, borderEndX, borderEndY).stroke() // main card border box
        pdfDoc.save()
    })
    pdfDoc.end()
}

function log(msg) {
    console.error(msg)
}
   
