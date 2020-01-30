import nanoid from 'nanoid/generate'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const handleRequest = async (store, request) => {
    const url = new URL(request.url)

    const contentType = request.headers.get('content-type')

    if (contentType !== 'application/json') {
        return new Response(JSON.stringify({}), {
            status: '400',
            statusText: 'Bad Request',
        })
    }

    const { email, referrer } = await request.json()
    const id = nanoid(alphabet, 6)
    const key = referrer ? `${referrer}:${id}` : id

    await store.put(key, JSON.stringify({ id, email, referrer }))

    return new Response(JSON.stringify({ id }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': url.origin,
        },
    })
}

function handleOptions(request) {
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

export default ({ store }) => {
    addEventListener('fetch', event => {
        const { request } = event

        if (request.method === 'OPTIONS') {
            event.respondWith(handleOptions(request))
        } else if (request.method === 'POST') {
            event.respondWith(handleRequest(store, request))
        } else {
            event.respondWith(async () => {
                return new Response(JSON.stringify({}), {
                    status: 405,
                    statusText: 'Method Not Allowed',
                })
            })
        }
    })
}
