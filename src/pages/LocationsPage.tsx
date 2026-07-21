import { Building2, Map, SunMoon } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function LocationsPage() {
  return (
    <PlaceholderScreen
      kicker="Story"
      title="Locations"
      description="Catalog sets and places used across the script. Later, these will feed scene headings and production reports."
      cards={[
        {
          title: 'Set list',
          description: 'Unique locations extracted from scene headings.',
          icon: Building2,
        },
        {
          title: 'Geography',
          description: 'Group locations by story world regions.',
          icon: Map,
        },
        {
          title: 'Day / night',
          description: 'Track time-of-day usage across the draft.',
          icon: SunMoon,
        },
      ]}
    />
  )
}
