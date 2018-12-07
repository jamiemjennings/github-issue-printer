const emojiStrip = require('emoji-strip')
const removeMd = require('remove-markdown')
const _ = require('lodash')

function sanitizeText (text) {
  if (!_.isString(text)) {
    throw new Error(`Argument is not a string: ${text}`)
  }
  text = text.replace(/\r/g, '') // pdfkit doesn't handle \r properly (\n is ok)
  text = removeMd(text, { stripListLeaders: false })
  text = emojiStrip(text).trim()
  return text
}

module.exports = { 
  sanitizeText
}