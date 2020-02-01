import 'whatwg-fetch'

import Router from '../router'
import CORS from './index'

test('enables cors', async () => {
    const r = CORS(new Router())

    const options = new Request('http://test/', { method: 'OPTIONS' })
    const optionsResp = await r.route(options)
    expect(optionsResp.headers.get('Access-Control-Allow-Origin')).toBe('*')

    const request = new Request('http://test/')
    const resp = await r.route(request)

    expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('*')
})

test('sets allowed methods', async () => {
    const r = CORS(new Router(), {
        origin: 'test',
        methods: ['OPTIONS, POST'],
    })

    const options = new Request('http://test/', {
        method: 'OPTIONS',
        headers: {
            Origin: 'test',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type',
        },
    })
    const resp = await r.route(options)
    expect(resp.ok).toBe(true)

    expect(resp.headers.get('Access-Control-Allow-Methods')).toBe(
        'OPTIONS, POST',
    )
})

test('sets allowed headers', async () => {
    const r = CORS(new Router(), {
        origin: 'test',
    })

    const options = new Request('http://test/', {
        method: 'OPTIONS',
        headers: {
            Origin: 'test',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type',
        },
    })
    const resp = await r.route(options)
    expect(resp.ok).toBe(true)

    expect(resp.headers.get('Access-Control-Allow-Headers')).toBe('*')
})

test('restrict headers', async () => {
    const r = CORS(new Router(), {
        origin: 'test',
        allowHeaders: ['Content-Type'],
    })

    const options = new Request('http://test/', {
        method: 'OPTIONS',
        headers: {
            Origin: 'test',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type',
        },
    })
    const resp = await r.route(options)
    expect(resp.ok).toBe(true)

    expect(resp.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type',
    )
})
