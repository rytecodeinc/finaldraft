import { useEffect } from 'react'
import {
  Clock3,
  FilePlus2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'
import { useScriptStore } from '@/stores/scriptStore'

export function DashboardPage() {
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const title = useScriptStore((s) => s.doc.title)
  const updatedAt = useScriptStore((s) => s.doc.updatedAt)
  const getPageEstimate = useScriptStore((s) => s.getPageEstimate)

  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  const pageEstimate = hydrated ? Math.max(1, getPageEstimate()) : 1
  const continueDescription = hydrated
    ? `Resume “${title.trim() || 'Untitled Screenplay'}” · ${pageEstimate} page${pageEstimate === 1 ? '' : 's'} · ${formatRelativeTime(updatedAt)}`
    : 'Jump back into your most recent screenplay session.'

  return (
    <PlaceholderScreen
      kicker="Workspace"
      title="Dashboard"
      description="Your writing command center. Open your active screenplay, start something new, or check in on streaks and ideas."
      cards={[
        {
          title: 'Continue writing',
          description: continueDescription,
          icon: Clock3,
          to: '/script',
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

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'just now'
  if (diffMs < hour) {
    const mins = Math.max(1, Math.round(diffMs / minute))
    return `${mins}m ago`
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour))
    return `${hours}h ago`
  }
  const days = Math.max(1, Math.round(diffMs / day))
  if (days < 14) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
