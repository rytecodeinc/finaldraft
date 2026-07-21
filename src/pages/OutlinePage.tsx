import { Layers3, ListOrdered, Waypoints } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function OutlinePage() {
  return (
    <PlaceholderScreen
      kicker="Story"
      title="Outline"
      description="Organize acts, sequences, and scenes in a hierarchical outline. Drag-and-drop structure tools arrive with the story model."
      cards={[
        {
          title: 'Acts & sequences',
          description: 'Nest story units and jump to any scene.',
          icon: Layers3,
        },
        {
          title: 'Scene list',
          description: 'Sortable index with INT/EXT and page counts.',
          icon: ListOrdered,
        },
        {
          title: 'Story spine',
          description: 'Keep the through-line visible while drafting.',
          icon: Waypoints,
        },
      ]}
    />
  )
}
