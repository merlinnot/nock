'use strict'

const http = require('http')
const { expect } = require('chai')
const assertRejects = require('assert-rejects')
const sinon = require('sinon')
const nock = require('..')
const got = require('./got_client')

require('./setup')

describe('`disableNetConnect()`', () => {
  it('prevents connection to unmocked hosts', async () => {
    nock.disableNetConnect()

    nock('http://www.example.test')
      .get('/')
      .reply(200)

    await assertRejects(
      got('https://other.example.test/'),
      /Nock: Disallowed net connect for "other.example.test:443\/"/
    )
  })

  it('prevents connections when no hosts are mocked', async () => {
    nock.disableNetConnect()

    await assertRejects(got('http://example.test'), err => {
      expect(err).to.include({
        code: 'ENETUNREACH',
        message: 'Nock: Disallowed net connect for "example.test:80/"',
      })
      expect(err.stack).to.be.a('string')
      return true
    })
  })
})

describe('`enableNetConnect()`', () => {
  it('enables real HTTP request only for specified domain, via string', async () => {
    const onResponse = sinon.spy()
    const server = http.createServer((request, response) => {
      onResponse()
      response.writeHead(200)
      response.end()
    })
    await new Promise(resolve => server.listen(resolve))

    nock.enableNetConnect('localhost')

    await got(`http://localhost:${server.address().port}/`)
    expect(onResponse).to.have.been.calledOnce()

    server.close()
  })

  it('disallows request for other domains, via string', async () => {
    nock.enableNetConnect('localhost')

    await assertRejects(
      got('https://example.test/'),
      /Nock: Disallowed net connect for "example.test:443\/"/
    )
  })

  it('enables real HTTP request only for specified domain, via regexp', async () => {
    const onResponse = sinon.spy()
    const server = http.createServer((request, response) => {
      onResponse()
      response.writeHead(200)
      response.end()
    })
    await new Promise(resolve => server.listen(resolve))

    nock.enableNetConnect(/ocalhos/)

    await got(`http://localhost:${server.address().port}/`)
    expect(onResponse).to.have.been.calledOnce()

    server.close()
  })

  it('disallows request for other domains, via regexp', async () => {
    nock.enableNetConnect(/ocalhos/)

    await assertRejects(
      got('https://example.test/'),
      /Nock: Disallowed net connect for "example.test:443\/"/
    )
  })
})
