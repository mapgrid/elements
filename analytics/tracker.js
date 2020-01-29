/*
 * Forked from usefathom/fathom, /assets/src/js/tracker.js
 * Copyright (c) 2019 Conva Ventures Inc
 * Copyright (c) 2020 MapGrid
 * Licensed under MIT
 */

const cookieName = '_analytics'

// convert object to query string
function stringifyObject(obj) {
    const keys = Object.keys(obj)

    return `?${keys
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
        .join('&')}`
}

function randomString(n) {
    const s = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array(n)
        .join()
        .split(',')
        .map(() => s.charAt(Math.floor(Math.random() * s.length)))
        .join('')
}

function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split('; ') : []

    for (let i = 0; i < cookies.length; i += 1) {
        const parts = cookies[i].split('=')
        if (decodeURIComponent(parts[0]) === name) {
            const cookie = parts.slice(1).join('=')
            return decodeURIComponent(cookie)
        }
    }

    return ''
}

function setCookie(name, data, args) {
    let str = `${encodeURIComponent(name)}=${encodeURIComponent(String(data))}`

    if (args.path) {
        str += `;path=${args.path}`
    }
    if (args.expires) {
        str += `;expires=${args.expires.toUTCString()}`
    }

    document.cookie = str
}

function newVisitorData() {
    return {
        isNewVisitor: true,
        isNewSession: true,
        pagesViewed: [],
        previousPageviewId: '',
        lastSeen: +new Date(),
    }
}

function getData() {
    const thirtyMinsAgo = new Date()
    thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30)

    let data = getCookie(cookieName)
    if (!data) {
        return newVisitorData()
    }

    try {
        data = JSON.parse(data)
    } catch (e) {
        console.error(e)
        return newVisitorData()
    }

    if (data.lastSeen < +thirtyMinsAgo) {
        data.isNewSession = true
    }

    return data
}

class Tracker {
    constructor(siteId, trackerUrl) {
        this.siteId = siteId
        this.trackerUrl = trackerUrl
    }

    trackPageview(_path, vars = {}) {
        // Respect "Do Not Track" requests
        if ('doNotTrack' in navigator && navigator.doNotTrack === '1') {
            return
        }

        // ignore prerendered pages
        if (
            'visibilityState' in document &&
            document.visibilityState === 'prerender'
        ) {
            return
        }

        // if <body> did not load yet, try again at dom ready event
        if (document.body === null) {
            document.addEventListener('DOMContentLoaded', () => {
                this.trackPageview(_path, vars)
            })
            return
        }

        //  parse request, use canonical if there is one
        let req = window.location

        // do not track if not served over HTTP or HTTPS (eg from local filesystem)
        if (req.host === '') {
            return
        }

        // find canonical URL
        const canonical = document.querySelector('link[rel="canonical"][href]')
        if (canonical) {
            const a = document.createElement('a')
            a.href = canonical.href

            // use parsed canonical as location object
            req = a
        }

        let path = vars.path || req.pathname + req.search
        if (!path) {
            path = '/'
        }

        // determine hostname
        const hostname = vars.hostname || `${req.protocol}//${req.hostname}`

        // only set referrer if not internal
        let referrer = vars.referrer || ''
        if (document.referrer.indexOf(hostname) < 0) {
            referrer = document.referrer
        }

        const data = getData()
        const d = {
            id: randomString(20),
            pid: data.previousPageviewId || '',
            p: path,
            h: hostname,
            r: referrer,
            u: data.pagesViewed.indexOf(path) === -1 ? 1 : 0,
            nv: data.isNewVisitor ? 1 : 0,
            ns: data.isNewSession ? 1 : 0,
            sid: this.siteId,
        }

        const url = this.trackerUrl
        const img = document.createElement('img')
        img.setAttribute('alt', '')
        img.setAttribute('aria-hidden', 'true')
        img.src = url + stringifyObject(d)
        img.addEventListener('load', () => {
            const now = new Date()
            const midnight = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                24,
                0,
                0,
            )

            // update data in cookie
            if (data.pagesViewed.indexOf(path) === -1) {
                data.pagesViewed.push(path)
            }
            data.previousPageviewId = d.id
            data.isNewVisitor = false
            data.isNewSession = false
            data.lastSeen = +new Date()
            setCookie(cookieName, JSON.stringify(data), {
                expires: midnight,
                path: '/',
            })

            // remove tracking img from DOM
            document.body.removeChild(img)
        })

        // in case img.onload never fires, remove img after 1s & reset src attribute to cancel request
        window.setTimeout(() => {
            if (!img.parentNode) {
                return
            }

            img.src = ''
            document.body.removeChild(img)
        }, 1000)

        // add to DOM to fire request
        document.body.appendChild(img)
    }
}

export default Tracker
