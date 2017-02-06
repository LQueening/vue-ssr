const Transform = require('stream').Transform
const serialize = require('serialize-javascript')

class HTMLStream extends Transform {
  constructor (options) {
    super()
    this.started = false
    const template = parseTemplate(options.template, options.contentPlaceholder)
    this.head = template.head
    this.neck = template.neck
    this.tail = template.tail
    this.context = options.context || {}
    this.styleMode = options.styleMode == null || options.styleMode
  }

  _transform (data, encoding, done) {
    if (!this.started) {
      this.emit('beforeStart')
      this.started = true
      this.push(this.head)
      // inline server-rendered head meta information
      if (this.context.head) {
        this.push(this.context.head)
      }
      // inline server-rendered CSS collected by vue-style-loader
      if (this.styleMode && this.context.styles) {
        this.push(this.context.styles)
      }
      this.push(this.neck)
    }
    this.push(data)
    done()
  }

  _flush (done) {
    this.emit('beforeEnd')
    // inline initial store state
    if (this.context.state) {
      this.push(`<script>window.__INITIAL_STATE__=${
        serialize(this.context.state, { isJSON: true })
        }</script>`)
    }
    if (!this.styleMode && this.context.styles) {
      this.push(this.context.styles)
    }
    this.push(this.tail)
    done()
  }
}

function parseTemplate (template, contentPlaceholder = '<!-- APP -->') {
  if (typeof template === 'object') {
    return template
  }

  let i = template.indexOf('</head>')
  const j = template.indexOf(contentPlaceholder)

  if (j < 0) {
    throw new Error(`Content placeholder not found in template.`)
  }

  if (i < 0) {
    i = template.indexOf('<body>')
    if (i < 0) {
      i = j
    }
  }

  return {
    head: template.slice(0, i),
    neck: template.slice(i, j),
    tail: template.slice(j + contentPlaceholder.length)
  }
}

module.exports = HTMLStream
