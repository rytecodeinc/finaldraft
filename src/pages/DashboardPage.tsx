import {
  Clock3,
  FilePlus2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function DashboardPage() {
  return (
    <PlaceholderScreen
      kicker="Workspace"
      title="Dashboard"
      description="Your writing command center. Recent projects, session stats, and quick actions will live here once project data is connected."
      cards={[
        {
          title: 'Continue writing',
          description: 'Jump back into your most recent screenplay session.',
          icon: Clock3,
        },
        {
          title: 'New project',
          description: 'Start a feature, short, TV episode, or stage play.',
          icon: FilePlus2,
        },
        {
          title: 'Writing streak',
          description: 'Track daily pages and focused writing time.',
          icon: TrendingUp,
        },
        {
          title: 'Ideas inbox',
          description: 'Capture loose concepts before they become beats.',
          icon: Sparkles,
        },
      ]}
    />
  )
}
