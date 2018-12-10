const PDFKit = require('pdfkit')
const _ = require('lodash')

module.exports = {
  createPdf: function (issues) {
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
      let issueNum = issue.number ? `#${issue.number}` : ''
      let cardTitle = issue.title
      let repoName = issue.repo ? issue.repo : ''

      let borderStartX = pdfDoc.page.margins.left - 15
      let borderStartY = pdfDoc.page.margins.top - 15
      let borderEndX = pdfDoc.page.width - borderStartX - pdfDoc.page.margins.right + 15
      let borderEndY = pdfDoc.page.maxY() - pdfDoc.page.margins.top + 15

      let headerBoxStartX = borderStartX
      let headerBoxEndX = borderEndX
      let headerBoxStartY = borderStartY
      let headerBoxEndY = pdfDoc.y + 7 // 7 magic number for extra padding

      if (issueNum || repoName) {
        // draw a light gray background for header with black outline
        pdfDoc.rect(headerBoxStartX, headerBoxStartY, headerBoxEndX, headerBoxEndY).fillOpacity(0.4).fillAndStroke('lightgray', 'black')
      }

      // back to regular opacity for header text
      pdfDoc.fillOpacity(1.0).fill('black')
      if (issueNum || repoName) {
        pdfDoc.font('Helvetica').fontSize(36).text(`${issueNum}: ${repoName}`) // header title
      }
      pdfDoc.fontSize(8).moveDown()
      pdfDoc.fontSize(8).moveDown()
        
      let issueTitleFontSize = 64
      let issueTitleHeight = 200
      if (_.isEmpty(issue.body)) {
        issueTitleFontSize = 48
        issueTitleHeight = 450
      }
      console.log(`#${issueNum}: body=${_.isEmpty(issue.body)}`)
      pdfDoc.font('Helvetica').fontSize(issueTitleFontSize).text(cardTitle, { height: issueTitleHeight, ellipsis: '...' }) // main text
      
      if (!_.isEmpty(issue.body)) {
        pdfDoc.fontSize(8).moveDown()
        pdfDoc.font('Helvetica').fontSize(32).text(issue.body, { height: 300, ellipsis: '...' })
      }
      pdfDoc.rect(borderStartX, borderStartY, borderEndX, borderEndY).stroke() // main card border box
      pdfDoc.save()
    })
    pdfDoc.end()
  }
}
