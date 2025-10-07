'use client'

import { useEffect } from 'react'

/**
 * Sends a Meta Pixel PageView when mounted.
 * Used on episode pages only.
 */
export default function MetaPixel() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'PageView')
      }
    } catch {}
  }, [])

  // Noscript fallback for when JS is disabled
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=1099152278399519&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}
