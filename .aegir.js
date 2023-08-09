import { setup as  setupMockPinning } from 'mock-ipfs-pinning-service'
import getPort from 'get-port';

const cleanupEvents = ['beforeExit', 'SIGTERM', 'SIGINT', 'SIGHUP']
const PINNING_SERVICE_TOKEN = 'secret'

/** @type {import('aegir').PartialOptions} */
const options = {

  test: {
    // set up https://www.npmjs.com/package/mock-ipfs-pinning-service
    before: async (options) => {
      console.log('aegir before')
      const port = await getPort();
      const pinningService = await setupMockPinning({ token: PINNING_SERVICE_TOKEN });
      const server = pinningService.listen(port, () => {
        console.log(`server listening on port ${port}`)
      });

      const stopServer = () => new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err)
          }
          console.log(`server stopped listening on port ${port}`)
          resolve()
        })
      })

      const cleanup = () => {
        // To prevent duplicated cleanup, remove the process listeners on cleanup
        cleanupEvents.forEach((event) => process.off(event, cleanup))
        stopServer()
      }

      // close the server when your process exits
      cleanupEvents.forEach((event) => process.on(event, cleanup))

      return {
        cleanup,
        env: {
          PINNING_SERVER_PORT: port,
          PINNING_SERVICE_TOKEN,
        }
      }
    },
    // tear down https://www.npmjs.com/package/mock-ipfs-pinning-service
    after: async (options, beforeResult) => {
      try {
        await beforeResult.cleanup()
      } catch {
        // ignoring errors
      }
    }
  }
}

export default options
