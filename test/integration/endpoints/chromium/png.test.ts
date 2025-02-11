import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { toMatchImageSnapshot } from 'jest-image-snapshot'
import { isCI } from 'std-env'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../../../fixtures/basic'),
})

expect.extend({ toMatchImageSnapshot })

describe.skipIf(() => isCI)('png', () => {
  it('basic', async () => {
    const png: ArrayBuffer = await $fetch('/__og-image__/image/chromium/og.png', {
      responseType: 'arrayBuffer',
    })

    expect(Buffer.from(png)).toMatchImageSnapshot()
  }, 60000)
})
