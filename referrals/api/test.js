import _ from 'lodash'
import 'whatwg-fetch'

import createReferrals from './index'

class Store {
    constructor(initialData = []) {
        this.data = initialData
    }

    async put(key, value) {
        const index = _.findIndex(this.data, ['key', key])

        if (index === -1) {
            this.data.push({ key, value })
        } else {
            this.data[index] = { key, value }
        }
    }

    async get(key, format) {
        const item = _.find(this.data, ['key', key])

        if (!item) {
            return null
        }

        if (format === 'json') {
            return JSON.parse(item.value)
        }

        return item.value
    }

    async list({ prefix = '', cursor = 0, limit = 5 }) {
        const allItems = _.filter(this.data, item =>
            item.key.startsWith(prefix),
        )
        const remaining = _.drop(allItems, cursor)
        const items = _.take(remaining, limit)

        return {
            keys: _.map(items, item => ({ name: item.key })),
            list_complete: cursor + items.length === allItems.length,
            cursor: cursor + items.length,
        }
    }
}

const mockEvent = (request, cb) => {
    const event = new Event('fetch')
    event.request = request
    event.respondWith = cb
    return event
}

test('adds fetch event listener', () => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    cleanup()
})

test('calls fetch event listener', done => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    const request = new Request('http://test/')
    const event = mockEvent(request, async e => {
        const res = await e

        expect(res.ok).toBe(false)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles post', done => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
    })

    const event = mockEvent(request, async e => {
        const res = await e

        expect(res.ok).toBe(false)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles json with no body', done => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
    })

    const event = mockEvent(request, async e => {
        const res = await e

        expect(res.ok).toBe(false)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles empty json', done => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({}),
    })

    const event = mockEvent(request, async e => {
        const res = await e

        expect(res.ok).toBe(false)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles new email', done => {
    const MOCK_STORE = new Store()

    const cleanup = createReferrals({
        store: MOCK_STORE,
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            email: 'test@example.com',
        }),
    })

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(res.ok).toBe(true)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')

        expect(json).toMatchObject({
            id: 'ac34084f',
            position: 0,
        })

        expect(MOCK_STORE.data[0]).toMatchObject({
            key: 'referrer:ac34084f',
        })

        expect(JSON.parse(MOCK_STORE.data[0].value)).toMatchObject({
            email: 'test@example.com',
        })

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles paged positions', done => {
    const MOCK_STORE = new Store([
        { key: 'referrer:a', value: 'a' },
        { key: 'referrer:b', value: 'b' },
        { key: 'referrer:c', value: 'c' },
        { key: 'referrer:d', value: 'd' },
        { key: 'referrer:e', value: 'e' },
        { key: 'referrer:f', value: 'f' },
        { key: 'referrer:g', value: 'g' },
    ])

    const cleanup = createReferrals({
        store: MOCK_STORE,
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            email: 'test@example.com',
        }),
    })

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(res.ok).toBe(true)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')

        expect(json).toMatchObject({
            id: 'ac34084f',
            position: 7,
        })

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles referrer', done => {
    const MOCK_STORE = new Store()

    const cleanup = createReferrals({
        store: MOCK_STORE,
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            email: 'test@example.com',
            referrer: 'abc',
        }),
    })

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(json).toMatchObject({
            id: 'ac34084f',
            position: 0,
        })

        expect(MOCK_STORE.data[0]).toMatchObject({
            key: 'referrer:ac34084f',
        })

        expect(JSON.parse(MOCK_STORE.data[0].value)).toMatchObject({
            referrer: 'abc',
        })

        expect(MOCK_STORE.data[1]).toMatchObject({
            key: 'referees:abc:ac34084f',
        })

        expect(MOCK_STORE.data[1].value).toBe('ac34084f')

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles same email', done => {
    const cleanup = createReferrals({
        store: new Store([
            {
                key: 'referrer:ac34084f',
                value: JSON.stringify({
                    email: 'test@example.com',
                    position: 0,
                }),
            },
        ]),
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            email: 'test@example.com',
        }),
    })

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(json).toMatchObject({
            id: 'ac34084f',
            position: 0,
        })

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles position', done => {
    const cleanup = createReferrals({
        store: new Store([
            {
                key: 'referrer:ac34084f',
                value: JSON.stringify({
                    email: 'test@example.com',
                    position: 0,
                }),
            },
        ]),
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            email: 'test2@example.com',
        }),
    })

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(json).toMatchObject({
            id: '4fb68c9d',
            position: 1,
        })

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handle query', done => {
    const cleanup = createReferrals({
        store: new Store([
            {
                key: 'referrer:ac34084f',
                value: JSON.stringify({
                    email: 'test@example.com',
                    position: 0,
                }),
            },
        ]),
        origin: 'test',
    })

    const request = new Request(
        'http://test/?rf=ac34084f&email=test@example.com',
    )

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(res.ok).toBe(true)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')
        expect(json).toMatchObject({
            id: 'ac34084f',
            position: 0,
        })

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handle mismatched query', done => {
    const cleanup = createReferrals({
        store: new Store([
            {
                key: 'referrer:ac34084f',
                value: JSON.stringify({
                    email: 'test@example.com',
                    position: 0,
                }),
            },
        ]),
        origin: 'test',
    })

    const request = new Request(
        'http://test/?rf=ac34084f&email=test2@example.com',
    )

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(res.ok).toBe(false)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')
        expect(json).toMatchObject({})

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handle non-existing email', done => {
    const cleanup = createReferrals({
        store: new Store([
            {
                key: 'referrer:ac34084f',
                value: JSON.stringify({
                    email: 'test@example.com',
                    position: 0,
                }),
            },
        ]),
        origin: 'test',
    })

    const request = new Request(
        'http://test/?rf=4fb68c9d&email=test2@example.com',
    )

    const event = mockEvent(request, async e => {
        const res = await e
        const json = await res.json()

        expect(res.ok).toBe(false)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')
        expect(json).toMatchObject({})

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles options', done => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'OPTIONS',
        headers: {
            Origin: 'http://test/',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        },
    })
    const event = mockEvent(request, async e => {
        const res = await e

        expect(res.ok).toBe(true)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('test')

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles naked options', done => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    const request = new Request('http://test/', {
        method: 'OPTIONS',
    })
    const event = mockEvent(request, async e => {
        const res = await e

        expect(res.ok).toBe(true)
        expect(res.headers.get('Allow')).toBe('POST, OPTIONS')

        done()
    })

    dispatchEvent(event)
    cleanup()
})

test('handles 404', done => {
    const cleanup = createReferrals({
        store: new Store(),
        origin: 'test',
    })

    const request = new Request('http://test/hello', {
        method: 'GET',
    })
    const event = mockEvent(request, async e => {
        const res = await e

        expect(res.ok).toBe(false)

        done()
    })

    dispatchEvent(event)
    cleanup()
})
