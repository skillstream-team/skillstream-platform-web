import { useEffect } from 'react'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

/**
 * Component to update document title based on platform settings
 */
export function PlatformTitle() {
  const { settings } = useSystemSettings()

  useEffect(() => {
    if (settings?.platformName) {
      document.title = `${settings.platformName} - Online Learning Platform`
    } else {
      document.title = 'SkillStream - Online Learning Platform'
    }
  }, [settings?.platformName])

  return null
}

