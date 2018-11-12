// require(...) see https://www.npmjs.com/package/static-module
const files = require('to-cache')()
const version = require('version')()
const blacklist = require('blacklist')()

const cacheName = `cache-v${version}`
let debug1 = console.log
let debug = console.log
let info = console.log
let log = console.log

self.addEventListener('install', event => {
  skipWaiting()
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(files)
    })
  )
  log('ServiceWorker installed')
})

self.addEventListener('activate', event => {
  return event.waitUntil(
    // TODO: migrate not yet expired dynamic content into new cache
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(cache => {
          info(`ServiceWorker: remove element from cache during activation => ${cache}`)
          return caches.delete(cache)
        })
      )
    })
    log('ServiceWorker activated')
  )
})

self.addEventListener('fetch', event => {
  debug('ServiceWorker is intercepting a client fetch')
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        debug("ServiceWorker is resolving the client fetch using it's cache")
        return response
      }

      return fetch(event.request).then(response => {
        debug('ServiceWorker has to fetch requested resource from server')
        var shouldCache = response.ok

        for (var i = 0; i < blacklist.length; ++i) {
          var expression = new RegExp(blacklist[i])
          if (expression.test(event.request.url)) {
            debug1("ServiceWorker decided to NOT cache the response from the server, based on the ServiceWorker's cache-blacklist")
            shouldCache = false
            break
          }
        }

        if (event.request.method == 'POST') {
          debug1('ServiceWorker decided to NOT cache the response from the server, because the request is a HTTP POST')
          shouldCache = false
        }

        if (shouldCache) {
          return caches.open(cacheName).then(cache => {
            debug("ServiceWorker is going to cache the server's response")
            cache.put(event.request, response.clone())
            return response
          })
        } else {
          return response
        }
      })
    })
  )
})
