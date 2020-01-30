import nanoid from 'nanoid/generate'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const handleRequest = async (store, request) => {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({}), { status: '400' })
    }

    const contentType = request.headers.get('content-type')

    if (contentType !== 'application/json') {
        return new Response(JSON.stringify({}), { status: '400' })
    }

    const { email, referrer } = await request.json()
    const id = nanoid(alphabet, 6)
    const key = referrer ? `${referrer}:${id}` : id

    await store.put(key, JSON.stringify({ id, email, referrer }))

    return new Response(JSON.stringify({ id }), {
        status: 200,
        headers: {
            'content-type': 'application/json',
        },
    })
}

export default ({ store }) => {
    addEventListener('fetch', event => {
        const { request } = event
        event.respondWith(handleRequest(store, request))
    })
}
