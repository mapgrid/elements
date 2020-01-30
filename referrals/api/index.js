const hashCode = source => {
    let hash = 0

    for (let i = 0; i < source.length; i += 1) {
        const char = source.charCodeAt(i)
        hash = (hash << 5) - hash + char // eslint-disable-line no-bitwise
        hash |= 0 // eslint-disable-line no-bitwise
    }

    return (hash >>> 0).toString(16) // eslint-disable-line no-bitwise
}

const handleRequest = async (store, origin, request) => {
    const contentType = request.headers.get('content-type')

    if (contentType !== 'application/json') {
        return new Response(JSON.stringify({}), {
            status: '400',
            statusText: 'Bad Request',
        })
    }

    const { email, referrer } = await request.json()
    const id = hashCode(email)

    const existing = await store.get(id)

    if (!existing) {
        const key = referrer ? `${referrer}:${id}` : id
        await store.put(
            key,
            JSON.stringify({
                id,
                email,
                referrer,
                timestamp: new Date().toISOString(),
            }),
        )
    }

    return new Response(JSON.stringify({ id }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
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

export default ({ store, origin }) => {
    addEventListener('fetch', event => {
        const { request } = event

        if (request.method === 'OPTIONS') {
            event.respondWith(handleOptions(request))
        } else if (request.method === 'POST') {
            event.respondWith(handleRequest(store, origin, request))
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
