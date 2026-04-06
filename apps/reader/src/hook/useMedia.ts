import { useEffect, useState } from 'react'

type MediaFlags = {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export function useMedia(): MediaFlags {
  const getMediaFlags = (): MediaFlags => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: false }
    }

    return {
      isMobile: window.matchMedia('(max-width: 767px)').matches,
      isTablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
      isDesktop: window.matchMedia('(min-width: 1024px)').matches,
    }
  }

  const [media, setMedia] = useState<MediaFlags>(getMediaFlags)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const queries = {
      mobileQuery: window.matchMedia('(max-width: 767px)'),
      tabletQuery: window.matchMedia('(min-width: 768px) and (max-width: 1023px)'),
      desktopQuery: window.matchMedia('(min-width: 1024px)'),
    }

    const updateMedia = () => {
      setMedia({
        isMobile: queries.mobileQuery.matches,
        isTablet: queries.tabletQuery.matches,
        isDesktop: queries.desktopQuery.matches,
      })
    }

    Object.values(queries).forEach((mq) => mq.addEventListener('change', updateMedia))

    // Initial state update
    updateMedia()

    return () => {
      Object.values(queries).forEach((mq) => mq.removeEventListener('change', updateMedia))
    }
  }, [])

  return media
}