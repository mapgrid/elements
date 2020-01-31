import Router from './router'

const hashCode = source => {
    let hash = 0

    for (let i = 0; i < source.length; i += 1) {
        const char = source.charCodeAt(i)
        hash = (hash << 5) - hash + char // eslint-disable-line no-bitwise
        hash |= 0 // eslint-disable-line no-bitwise
    }

    return (hash >>> 0).toString(16) // eslint-disable-line no-bitwise
}

const handle400 = origin =>
    new Response(JSON.stringify({}), {
        status: 400,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
        },
    })

const handlePost = (store, origin) => async request => {
    const contentType = request.headers.get('content-type')

    if (contentType !== 'application/json') {
        return new Response(JSON.stringify({}), {
            status: '400',
            statusText: 'Bad Request',
        })
    }

    const { email, referrer } = await request.json()
    const id = hashCode(email)

    let position = 0
    const existing = await store.get(`referrer:${id}`)

    if (existing) {
        position = existing.position
    } else {
        let cursor = null
        let listComplete = false

        while (!listComplete) {
            // eslint-disable-next-line no-await-in-loop
            const all = await store.list({
                prefix: `referrer:`,
                ...(cursor ? { cursor } : {}),
            })

            listComplete = all.list_complete
            cursor = all.cursor
            position += all.keys.length
        }

        await store.put(
            `referrer:${id}`,
            JSON.stringify({
                id,
                email,
                referrer,
                position,
                timestamp: new Date().toISOString(),
            }),
        )

        if (referrer) {
            await store.put(`referees:${referrer}:${id}`, id)
        }
    }

    return new Response(JSON.stringify({ id, position }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
        },
    })
}

const handleQuery = (store, origin) => async request => {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    const id = url.searchParams.get('rf')

    if (hashCode(email) !== id) {
        return handle400(origin)
    }

    const existing = await store.get(`referrer:${id}`)

    if (!existing) {
        return handle400(origin)
    }

    return new Response(JSON.stringify({ id, position: existing.position }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
        },
    })
}

const handleOptions = async request => {
    if (
        request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null
    ) {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        })
    }

    return new Response(null, {
        headers: {
            Allow: 'POST, OPTIONS',
        },
    })
}

const handleRequest = async (store, origin, request) => {
    const r = new Router()
    r.post('/', handlePost(store, origin))
    r.options('/.*', handleOptions)
    r.get('/', handleQuery(store, origin))

    const resp = await r.route(request)
    return resp
}

export default ({ store, origin }) => {
    addEventListener('fetch', event => {
        event.respondWith(handleRequest(store, origin, event.request))
    })
}
