import { ClipboardList, PieChart, Timer } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function ReportsPage() {
  return (
    <PlaceholderScreen
      kicker="Production"
      title="Reports"
      description="Scene reports, character speaking time, location breakdowns, and other production-facing summaries."
      cards={[
        {
          title: 'Scene report',
          description: 'Page counts, INT/EXT, and cast lists per scene.',
          icon: ClipboardList,
        },
        {
          title: 'Cast breakdown',
          description: 'Who speaks where, and how often.',
          icon: PieChart,
        },
        {
          title: 'Runtime estimate',
          description: 'Approximate screen time from page length.',
          icon: Timer,
        },
      ]}
    />
  )
}
