import { useCallback, useEffect, useRef } from 'react'

type Orientation = 'vertical' | 'vertical-left' | 'horizontal'

interface ResizerProps {
  orientation: Orientation
  onResize: (delta: number) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

export function Resizer({ orientation, onResize, onResizeStart, onResizeEnd }: ResizerProps) {
  const dragging = useRef(false)
  const lastPos = useRef(0)

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragging.current) return
      const pos = orientation === 'horizontal' ? event.clientY : event.clientX
      const delta = pos - lastPos.current
      lastPos.current = pos
      onResize(delta)
    },
    [onResize, orientation],
  )

  const stop = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    onResizeEnd?.()
  }, [onResizeEnd])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [onPointerMove, stop])

  return (
    <div
      className={`resizer resizer--${orientation}`}
      role="separator"
      aria-orientation={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
      onPointerDown={(event) => {
        event.preventDefault()
        dragging.current = true
        lastPos.current = orientation === 'horizontal' ? event.clientY : event.clientX
        document.body.style.cursor =
          orientation === 'horizontal' ? 'row-resize' : 'col-resize'
        document.body.style.userSelect = 'none'
        onResizeStart?.()
      }}
    />
  )
}
