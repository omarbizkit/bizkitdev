import { beforeEach } from 'vitest'

beforeEach(() => {
  // Set up global window for browser-like environments
  if (typeof global !== 'undefined') {
    global.window = {
      location: {
        origin: 'http://localhost:4321'
      }
    } as any
  }
})

// Set up window.location for browser environments
if (typeof window !== 'undefined') {
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
}
