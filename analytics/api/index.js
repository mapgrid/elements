const b64toArray = base64 => {
    const byteString = atob(base64)

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i)
    }

    return ab
}

const blob = b64toArray(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
)

const handleRequest = async (KV, request) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const pathname = url.searchParams.get('p')
    const hostname = url.searchParams.get('h')
    const referrer = url.searchParams.get('r')
    const isUnique = url.searchParams.get('u')
    const isNewVisitor = url.searchParams.get('nv')
    const isNewSession = url.searchParams.get('ns')
    const siteTrackingId = url.searchParams.get('sid')

    if (siteTrackingId && id) {
        await KV.put(
            `${siteTrackingId}:${new Date().toISOString()}:${id}`,
            JSON.stringify({
                id,
                pathname,
                hostname,
                referrer,
                isUnique,
                isNewVisitor,
                isNewSession,
                siteTrackingId,
            }),
        )
    }

    return new Response(blob, {
        status: 200,
        headers: {
            Tk: 'N',
            'Content-Type': 'image/gif',
            Expires: 'Mon, 01 Jan 1990 00:00:00 GMT',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
        },
    })
}

export default KV => event => {
    const { request } = event
    event.respondWith(handleRequest(KV, request))
}
