import 'whatwg-fetch'

import Router from './index'

test('creates router', async () => {
    const r = new Router()

    const request = new Request('http://test/')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({})
})

test('handles path', async () => {
    const r = new Router()
    r.get('/hello', () => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/hello')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({ name: 'world' })
})

test('handles regex path', async () => {
    const r = new Router()
    r.get('/hello/.*', () => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/hello/world')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({ name: 'world' })
})

test.each`
    method
    ${'connect'}
    ${'delete'}
    ${'get'}
    ${'head'}
    ${'options'}
    ${'patch'}
    ${'post'}
    ${'put'}
    ${'trace'}
`('handles methods', async ({ method }) => {
    const r = new Router()
    r[method]('/', () => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/', {
        method,
    })
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({ name: 'world' })
})

test('handles all', async () => {
    const r = new Router()
    r.all(() => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({ name: 'world' })
})

test('handles dynamic condition', async () => {
    const r = new Router()
    r.handle(() => true, () => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({ name: 'world' })
})

test('handles empty condition', async () => {
    const r = new Router()
    r.handle(false, () => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({ name: 'world' })
})

test('handles empty conditions', async () => {
    const r = new Router()
    r.handle([], () => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(json).toEqual({ name: 'world' })
})

test('handles 404', async () => {
    const r = new Router()
    r.get('/hello/.*', () => new Response(JSON.stringify({ name: 'world' })))

    const request = new Request('http://test/')
    const resp = await r.route(request)
    const json = await resp.json()

    expect(resp.ok).toBe(false)
    expect(json).toEqual({})
})
