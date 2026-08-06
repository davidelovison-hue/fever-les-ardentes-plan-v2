import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollPageToTop } from '../lib/scrollPageToTop'

/** Recenter at the top on every route change in the funnel. */
export function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation()

  useLayoutEffect(() => {
    return scrollPageToTop()
  }, [pathname, search, hash, key])

  return null
}
