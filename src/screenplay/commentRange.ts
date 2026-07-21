import type { ElementComment } from '@/screenplay/types'

export interface TextRange {
  start: number
  end: number
}

/** Clamp and normalize a selection; null when empty / collapsed. */
export function normalizeTextRange(
  start: number,
  end: number,
  textLength: number,
): TextRange | null {
  const a = Math.max(0, Math.min(Math.min(start, end), textLength))
  const b = Math.max(0, Math.min(Math.max(start, end), textLength))
  if (b <= a) return null
  return { start: a, end: b }
}

/** Partial highlight for a comment, or null when it covers the whole element. */
export function commentHighlightRange(
  comment: Pick<ElementComment, 'startOffset' | 'endOffset'>,
  textLength: number,
): TextRange | null {
  if (
    typeof comment.startOffset !== 'number' ||
    typeof comment.endOffset !== 'number'
  ) {
    return null
  }
  return normalizeTextRange(comment.startOffset, comment.endOffset, textLength)
}

export function getCommentQuote(
  comment: Pick<ElementComment, 'startOffset' | 'endOffset' | 'quote'>,
  elementText?: string,
): string | null {
  if (comment.quote && comment.quote.trim()) return comment.quote
  if (
    elementText &&
    typeof comment.startOffset === 'number' &&
    typeof comment.endOffset === 'number'
  ) {
    const range = normalizeTextRange(
      comment.startOffset,
      comment.endOffset,
      elementText.length,
    )
    if (range) return elementText.slice(range.start, range.end)
  }
  return null
}

export function mergeTextRanges(ranges: TextRange[]): TextRange[] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const out: TextRange[] = [{ ...sorted[0]! }]
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!
    const last = out[out.length - 1]!
    if (next.start <= last.end) {
      last.end = Math.max(last.end, next.end)
    } else {
      out.push({ ...next })
    }
  }
  return out
}
