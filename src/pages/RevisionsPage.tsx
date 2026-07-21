import { Diff, History, Palette } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function RevisionsPage() {
  return (
    <PlaceholderScreen
      kicker="Production"
      title="Revisions"
      description="Colored revision pages, locked page numbers, and change tracking — the production layer writers expect from Final Draft."
      cards={[
        {
          title: 'Revision colors',
          description: 'Blue, pink, yellow, and custom revision sets.',
          icon: Palette,
        },
        {
          title: 'Change history',
          description: 'Browse prior drafts and restored scenes.',
          icon: History,
        },
        {
          title: 'Diff view',
          description: 'Compare two drafts side by side.',
          icon: Diff,
        },
      ]}
    />
  )
}
