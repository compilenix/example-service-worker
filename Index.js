#!/usr/bin/env node

'use strict'

const fs = require('fs')
const crypto = require('crypto')
const http = require('http')

const express = require('express')
const morgan = require('morgan')
const staticModule = require('static-module')

const app = express()
app.use(morgan('combined'))

app.get('/sw.js', async (req, res) => {
  const filePath = './static/sw.js'
  if (fs.accessSync(filePath, fs.constants.R_OK)) {
    res.sendStatus(404)
    return
  }

  const fileReader = fs.createReadStream(filePath)

  res.set({
    'Content-Type': 'application/javascript; charset=UTF-8',
    'Cache-Control': 'public, no-cache'
  })

  fileReader.pipe(staticModule({ // see https://www.npmjs.com/package/static-module
    'to-cache': () => JSON.stringify([
      '/site.css',
      '/Index.js',
      '/header.html',
      '/footer.html',
      '/SiteAppander.js'
    ], null, '  '),
    'version': () => JSON.stringify(1),
    'blacklist': () => JSON.stringify(['/login'])
  }))
    .pipe(res)
})

app.use(express.static('static', {
  'etag': false,
  'lastModified': true,
  setHeaders: (res, path, stat) => {
    res.set('Cache-Control', 'public, no-cache') // TODO: add max-age if static content has unique names per file vesion and is generated using build process
  }
}))

app.get('/', (req, res) => {
  console.log(req.url)
  // req.item = req.params[0];
  let content
  if ('partial' in req.query) {
    // TODO: implement partial content loading
  } else {
    content = [
      fs.readFileSync('static/header.html'),
      // TODO: add requested content
      fs.readFileSync('static/footer.html')
    ]
  }

  Promise.all(content)
    .then(content => content.map(x => x.toString('utf-8')))
    .then(content => {
      const contentFinal = content.join('')

      res.set({
        'ETag': crypto.createHash('sha256').update(contentFinal).digest('hex'),
        'Cache-Control': 'public, no-cache'
      })
      res.send(contentFinal)
    })
    .catch(err => res.status(500).send(err.toString()))
})

// https.createServer({key: fs.readFileSync("key.pem"),cert: fs.readFileSync("cert.pem")}, app).listen(8081);
http.createServer(app).listen(8081)

console.log('http://localhost:8081/')
