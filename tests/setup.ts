import { beforeEach } from 'vitest'

beforeEach(() => {
  global.window = {
    location: {
      origin: 'http://localhost:4321'
    }
  } as any
})

Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:4321',
    hostname: 'localhost',
    port: '4321',
    protocol: 'http:',
    href: 'http://localhost:4321'
  },
  writable: true
})
