const handleOptions = ({
    origin = '*',
    methods = ['GET', 'HEAD', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders = ['*'],
}) => async request => {
    if (
        request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null
    ) {
        const headers = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': allowHeaders.join(', '),
        }

        return new Response(null, { headers })
    }

    return new Response(null, {
        headers: {
            Allow: methods.join(', '),
        },
    })
}

export default (r, options = {}) => {
    r.options('/.*', handleOptions(options))

    const orgRoute = r.route.bind(r)

    // eslint-disable-next-line no-param-reassign
    r.route = async req => {
        const response = await orgRoute(req)
        response.headers.set(
            'Access-Control-Allow-Origin',
            options.origin || '*',
        )
        return response
    }

    return r
}
