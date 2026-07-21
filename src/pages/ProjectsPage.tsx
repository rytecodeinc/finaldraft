import { Clapperboard, Film, Tv } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function ProjectsPage() {
  return (
    <PlaceholderScreen
      kicker="Workspace"
      title="Projects"
      description="Manage screenplay projects, templates, and collaborators. This view is a visual placeholder until the project model lands."
      cards={[
        {
          title: 'Feature film',
          description: 'Standard 90–120 page feature template.',
          icon: Film,
        },
        {
          title: 'Television',
          description: 'Half-hour and hour-drama episode shells.',
          icon: Tv,
        },
        {
          title: 'Short / pilot',
          description: 'Compact formats for proof-of-concept scripts.',
          icon: Clapperboard,
        },
      ]}
    />
  )
}
