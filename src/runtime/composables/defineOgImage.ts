import type { ActiveHeadEntry } from '@unhead/schema'
import { defu } from 'defu'
import { appendHeader } from 'h3'
import { createRouter as createRadixRouter, toRouteMatcher } from 'radix3'
import { withoutBase } from 'ufo'
import type { NitroRouteRules } from 'nitropack'
import type { DefineOgImageInput, OgImageOptions } from '../types'
import { getOgImagePath, separateProps, useOgImageRuntimeConfig } from '../utils'
import { createOgImageMeta, normaliseOptions } from '../nuxt/utils'
import { useNuxtApp, useRequestEvent, useRoute, useRuntimeConfig } from '#imports'

export function defineOgImage(_options: DefineOgImageInput = {}) {
  // string is supported as an easy way to override the generated og image data
  // clone to avoid any issues
  if (!import.meta.server)
    return

  const nuxtApp = useNuxtApp()
  const ogImageInstances = nuxtApp.ssrContext!._ogImageInstances || []
  const route = useRoute()
  const basePath = route.path || '/' // (pages may be disabled)

  // need to check route rules hasn't disabled this
  const _routeRulesMatcher = toRouteMatcher(
    createRadixRouter({ routes: useRuntimeConfig().nitro?.routeRules }),
  )
  const routeRules = defu({}, ..._routeRulesMatcher.matchAll(
    withoutBase(basePath.split('?')[0], useRuntimeConfig().app.baseURL),
  ).reverse()).ogImage as NitroRouteRules['ogImage']
  // has been disabled by route rules
  if (!_options || nuxtApp.ssrContext?.event.context._nitro?.routeRules?.ogImage === false || (typeof routeRules !== 'undefined' && routeRules === false)) {
    // remove the previous entries
    ogImageInstances.forEach((e: ActiveHeadEntry<any>) => {
      e.dispose()
    })
    nuxtApp.ssrContext!._ogImageInstances = undefined
    return
  }
  const options = normaliseOptions({
    ..._options,
  })
  if (route.query)
    options._query = route.query
  const { defaults } = useOgImageRuntimeConfig()
  const resolvedOptions = normaliseOptions(defu(separateProps(_options), separateProps(routeRules), defaults) as OgImageOptions)
  // allow overriding using a prebuild config
  if (_options.url) {
    createOgImageMeta(null, options, resolvedOptions, nuxtApp.ssrContext)
  }
  else {
    const path = getOgImagePath(basePath, resolvedOptions)
    if (import.meta.prerender)
      appendHeader(useRequestEvent(), 'x-nitro-prerender', path)
    createOgImageMeta(path, options, resolvedOptions, nuxtApp.ssrContext)
  }
}
