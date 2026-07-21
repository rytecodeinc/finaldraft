import { useEffect, useState } from 'react'
import { INT_EXT_OPTIONS } from '@/screenplay/elementRules'
import { collectTimesOfDay } from '@/screenplay/smartType'
import type { SceneInfo } from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

interface SceneMetaEditorProps {
  scene: SceneInfo
}

export function SceneMetaEditor({ scene }: SceneMetaEditorProps) {
  const updateSceneMeta = useScriptStore((s) => s.updateSceneMeta)
  const elements = useScriptStore((s) => s.doc.elements)

  const [intExt, setIntExt] = useState(scene.intExt ?? 'INT.')
  const [location, setLocation] = useState(scene.location ?? '')
  const [timeOfDay, setTimeOfDay] = useState(scene.timeOfDay ?? '')

  // Sync from the script when the scene changes externally, but never while
  // the user is mid-edit in the location field (preserves spaces / caret).
  useEffect(() => {
    const locationFocused =
      document.activeElement?.id === 'inspector-location'

    setIntExt(scene.intExt ?? 'INT.')
    if (!locationFocused) setLocation(scene.location ?? '')
    setTimeOfDay(scene.timeOfDay ?? '')
  }, [scene.id, scene.heading, scene.intExt, scene.location, scene.timeOfDay])

  const intExtOptions = INT_EXT_OPTIONS.includes(
    intExt as (typeof INT_EXT_OPTIONS)[number],
  )
    ? INT_EXT_OPTIONS
    : ([intExt, ...INT_EXT_OPTIONS] as string[])

  // Same source as SmartType time suggestions (script times + defaults).
  const smartTypeTimes = collectTimesOfDay(elements)
  const timeOptions =
    timeOfDay && !smartTypeTimes.includes(timeOfDay)
      ? [timeOfDay, ...smartTypeTimes]
      : smartTypeTimes

  return (
    <>
      <div className="inspector-field">
        <label htmlFor="inspector-int-ext">INT / EXT</label>
        <select
          id="inspector-int-ext"
          value={intExt}
          onChange={(e) => {
            const value = e.target.value
            setIntExt(value)
            updateSceneMeta(scene.id, { intExt: value })
          }}
        >
          {intExtOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="inspector-field">
        <label htmlFor="inspector-location">Location</label>
        <input
          id="inspector-location"
          type="text"
          value={location}
          onChange={(e) => {
            const value = e.target.value
            setLocation(value)
            updateSceneMeta(scene.id, { location: value })
          }}
          onBlur={() => {
            const normalized = location.replace(/\s+/g, ' ').trim()
            setLocation(normalized)
            updateSceneMeta(scene.id, { location: normalized })
          }}
          placeholder="LOCATION"
          autoComplete="off"
        />
      </div>

      <div className="inspector-field">
        <label htmlFor="inspector-time">Time of day</label>
        <select
          id="inspector-time"
          value={timeOfDay}
          onChange={(e) => {
            const value = e.target.value
            setTimeOfDay(value)
            updateSceneMeta(scene.id, { timeOfDay: value })
          }}
        >
          <option value="">—</option>
          {timeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="inspector-row">
        <span>Heading</span>
        <span className="inspector-heading">{scene.heading}</span>
      </div>
    </>
  )
}
