import { Columns3, Move, StickyNote } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function BeatBoardPage() {
  return (
    <PlaceholderScreen
      kicker="Story"
      title="Beat Board"
      description="A visual corkboard for story beats. Cards, columns, and color coding will map directly to outline and script elements."
      cards={[
        {
          title: 'Beat cards',
          description: 'Capture plot points as movable story units.',
          icon: StickyNote,
        },
        {
          title: 'Board columns',
          description: 'Group beats by act, subplot, or sequence.',
          icon: Columns3,
        },
        {
          title: 'Spatial drafting',
          description: 'Rearrange structure before committing to pages.',
          icon: Move,
        },
      ]}
    />
  )
}
