import Router from '../../shared/router'
import CORS from '../../shared/cors'

const hashCode = source => {
    let hash = 0

    for (let i = 0; i < source.length; i += 1) {
        const char = source.charCodeAt(i)
        hash = (hash << 5) - hash + char // eslint-disable-line no-bitwise
        hash |= 0 // eslint-disable-line no-bitwise
    }

    return (hash >>> 0).toString(16) // eslint-disable-line no-bitwise
}

const handle400 = () =>
    new Response(JSON.stringify({}), {
        status: 400,
        headers: {
            'Content-Type': 'application/json',
        },
    })

const handlePost = store => async request => {
    const contentType = request.headers.get('content-type')

    if (contentType !== 'application/json') {
        return handle400()
    }

    const { email, referrer } = await request.json().catch(() => ({}))

    if (!email) {
        return handle400()
    }

    const id = hashCode(email)

    let position = 0
    const existing = await store.get(`referrer:${id}`, 'json')

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
        },
    })
}

const handleQuery = store => async request => {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    const id = url.searchParams.get('rf')

    if (!email || !id) {
        return handle400()
    }

    if (hashCode(email) !== id) {
        return handle400()
    }

    const existing = await store.get(`referrer:${id}`, 'json')

    if (!existing) {
        return handle400()
    }

    let cursor = null
    let listComplete = false
    let referrals = 0

    while (!listComplete) {
        // eslint-disable-next-line no-await-in-loop
        const all = await store.list({
            prefix: `referees:${id}:`,
            ...(cursor ? { cursor } : {}),
        })

        listComplete = all.list_complete
        cursor = all.cursor
        referrals += all.keys.length
    }

    return new Response(
        JSON.stringify({
            id,
            position: existing.position,
            referrals,
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        },
    )
}

const handleRequest = async (store, origin, request) => {
    const r = CORS(new Router(), {
        origin,
        methods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
    })

    r.post('/', handlePost(store))
    r.get('/', handleQuery(store))

    const resp = await r.route(request)
    return resp
}

const createListener = (store, origin) => event => {
    event.respondWith(handleRequest(store, origin, event.request))
}

export default ({ store, origin }) => {
    const listener = createListener(store, origin)
    addEventListener('fetch', listener)
    return () => {
        removeEventListener('fetch', listener)
    }
}
