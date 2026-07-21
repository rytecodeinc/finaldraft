import { HeartHandshake, IdCard, MessagesSquare } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function CharactersPage() {
  return (
    <PlaceholderScreen
      kicker="Story"
      title="Characters"
      description="Build a character bible linked to dialogue, scene appearances, and relationships — without leaving the IDE."
      cards={[
        {
          title: 'Profiles',
          description: 'Names, roles, arcs, and reference notes.',
          icon: IdCard,
        },
        {
          title: 'Relationships',
          description: 'Map alliances, conflicts, and subplots.',
          icon: HeartHandshake,
        },
        {
          title: 'Dialogue index',
          description: 'Jump to every speaking appearance.',
          icon: MessagesSquare,
        },
      ]}
    />
  )
}
