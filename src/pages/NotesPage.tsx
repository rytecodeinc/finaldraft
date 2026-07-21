import { BookOpen, Lightbulb, Paperclip } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'

export function NotesPage() {
  return (
    <PlaceholderScreen
      kicker="Story"
      title="Notes"
      description="Research, voice memos, and freeform scratch pads that stay attached to the project — not buried in another app."
      cards={[
        {
          title: 'Research',
          description: 'Collect references and source material.',
          icon: BookOpen,
        },
        {
          title: 'Idea capture',
          description: 'Quick notes that can graduate into beats.',
          icon: Lightbulb,
        },
        {
          title: 'Attachments',
          description: 'Link images, PDFs, and external docs.',
          icon: Paperclip,
        },
      ]}
    />
  )
}
