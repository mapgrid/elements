const handleRequest = async () => {
    return new Response(JSON.stringify({ hello: 'world' }), {
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
    })
}

export default KV => event => {
    const { request } = event
    event.respondWith(handleRequest(KV, request))
}
