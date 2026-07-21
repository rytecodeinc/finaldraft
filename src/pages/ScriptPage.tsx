export function ScriptPage() {
  return (
    <div className="page" style={{ overflow: 'hidden', height: '100%' }}>
      <div className="script-canvas">
        <div className="script-page" aria-label="Script page placeholder">
          <div className="script-line script-line--scene" />
          <div className="script-line script-line--action" />
          <div className="script-line script-line--action" />
          <div className="script-line script-line--action-short" />
          <div className="script-line script-line--character" />
          <div className="script-line script-line--parenthetical" />
          <div className="script-line script-line--dialogue" />
          <div className="script-line script-line--dialogue" />
          <div className="script-line script-line--dialogue" style={{ width: '42%', marginBottom: 28 }} />
          <div className="script-line script-line--action" />
          <div className="script-line script-line--action-short" />
          <div className="script-line script-line--scene" />
          <div className="script-line script-line--action" />
          <div className="script-line script-line--action-short" />
          <div className="script-line script-line--character" />
          <div className="script-line script-line--dialogue" />
          <div className="script-line script-line--dialogue" style={{ width: '48%' }} />
          <p className="script-watermark">
            Structured screenplay editor — milestone 2
          </p>
        </div>
      </div>
    </div>
  )
}
