import nanoid from 'nanoid'

import Router from '../../shared/router'
import CORS from '../../shared/cors'

const handle400 = () =>
    new Response(JSON.stringify({}), {
        status: 400,
        headers: {
            'Content-Type': 'application/json',
        },
    })

const handlePost = (store, email) => async request => {
    const contentType = request.headers.get('content-type')

    if (contentType !== 'application/json') {
        return handle400()
    }

    const json = await request.json().catch(() => ({}))
    const id = nanoid()

    await store.put(
        `${id}`,
        JSON.stringify({
            timestamp: new Date().toISOString(),
            ...json,
        }),
    )

    if (email !== undefined) {
        const { endpoint, apiKey, from: fromAddress, to, subject, text } = email

        const body = typeof text === 'function' ? text(json) : text

        const formData = new FormData()
        formData.append('from', fromAddress)
        formData.append('to', to)
        formData.append('subject', subject)
        formData.append('text', body)

        await fetch(`${endpoint}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
            },
            body: formData,
        })
    }

    return new Response(JSON.stringify({ id }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

const handleRequest = async (store, email, origin, request) => {
    const r = CORS(new Router(), {
        origin,
        methods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
    })

    r.post('/', handlePost(store, email))

    const resp = await r.route(request)
    return resp
}

const createListener = (store, email, origin) => event => {
    event.respondWith(handleRequest(store, email, origin, event.request))
}

export default ({ store, email, origin }) => {
    const listener = createListener(store, email, origin)
    addEventListener('fetch', listener)
    return () => {
        removeEventListener('fetch', listener)
    }
}
