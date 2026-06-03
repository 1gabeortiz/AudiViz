
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizePaletteStops(paletteColors) {
  const fallback = [
    { id: "stop-1", color: "#7c4dff", position: 0 },
    { id: "stop-2", color: "#00d4ff", position: 50 },
    { id: "stop-3", color: "#ff4da6", position: 100 },
  ]

  if (!Array.isArray(paletteColors) || paletteColors.length < 2) return fallback

  const first = paletteColors[0]
  const stops = typeof first === "string"
    ? paletteColors.map((color, index, arr) => ({
        id: `legacy-stop-${index + 1}`,
        color: color.toLowerCase(),
        position: Math.round((index / (arr.length - 1)) * 100),
      }))
    : paletteColors.map((stop, index) => ({
        id: stop.id || `stop-${index + 1}`,
        color: (stop.color || "#7c4dff").toLowerCase(),
        position: Number.isFinite(stop.position) ? stop.position : index * 50,
      }))

  stops.sort((a, b) => a.position - b.position)
  stops[0].position = 0
  stops[stops.length - 1].position = 100
  return stops
}

function CustomizerPanel({ settings, onChange, disabled = false }) {
  const defaultSingleColor = "#7c4dff"
  const singleColorValue = settings.singleColor || defaultSingleColor

  function update(key, value) {
    onChange((prev) => ({ ...prev, [key]: value }))
  }

  function setPaletteStops(nextStops) {
    update("paletteColors", normalizePaletteStops(nextStops))
  }

  const paletteStops = normalizePaletteStops(settings.paletteColors)

  function updatePaletteColor(id, nextColor) {
    const nextStops = paletteStops.map((stop) =>
      stop.id === id ? { ...stop, color: nextColor.toLowerCase() } : stop
    )
    setPaletteStops(nextStops)
  }

  function updatePalettePosition(id, nextPosition) {
    const index = paletteStops.findIndex((stop) => stop.id === id)
    if (index <= 0 || index >= paletteStops.length - 1) return // Keep anchors fixed

    const min = paletteStops[index - 1].position + 1
    const max = paletteStops[index + 1].position - 1
    const clamped = clamp(Number(nextPosition), min, max)

    const nextStops = paletteStops.map((stop) =>
      stop.id === id ? { ...stop, position: clamped } : stop
    )
    setPaletteStops(nextStops)
  }

   function getNextStopId(stops) {
    const maxId = stops.reduce((max, stop) => {
      const match = String(stop.id || "").match(/(\d+)$/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0)
  
    return `stop-${maxId + 1}`
  }

  function addPaletteStop() {
    if (paletteStops.length >= 8) return

    // Insert before the final anchor (100%)
    const insertAt = paletteStops.length - 1
    const left = paletteStops[insertAt - 1]
    const right = paletteStops[insertAt]
    const midPosition = Math.round((left.position + right.position) / 2)

    const newStop = {
      id: getNextStopId(paletteStops),
      color: left.color,
      position: midPosition,
    }

    const nextStops = [
      ...paletteStops.slice(0, insertAt),
      newStop,
      ...paletteStops.slice(insertAt),
    ]
    setPaletteStops(nextStops)
  }

  function removePaletteStop(id) {
    const index = paletteStops.findIndex((stop) => stop.id === id)
    if (index <= 0 || index >= paletteStops.length - 1) return // Keep anchors fixed
    if (paletteStops.length <= 2) return

    const nextStops = paletteStops.filter((stop) => stop.id !== id)
    setPaletteStops(nextStops)
  }

  return (
    <section className="customizer">
      <h2>Visualizer Controls</h2>

      <label>
        Color Mode
        <select
          value={settings.colorMode}
          onChange={(e) => update("colorMode", e.target.value)}
          disabled={disabled}
        >
          <option value="rainbow">Rainbow</option>
          <option value="single">Single Color</option>
          <option value="palette">Palette</option>
        </select>
      </label>

      {settings.colorMode === "single" && (
        <label>
          Single Color
          <input
            type="color"
            value={singleColorValue}
            onInput={(e) => update("singleColor", e.target.value.toLowerCase())}
            onChange={(e) => update("singleColor", e.target.value.toLowerCase())}
            disabled={disabled}
          />
          <small>{singleColorValue.toUpperCase()}</small>
        </label>
      )}

      {settings.colorMode === "palette" && (
        <div className="palette-editor">
          <label>Palette Stops</label>

          {paletteStops.map((stop, index) => {
            const isAnchor = index === 0 || index === paletteStops.length - 1
            const min = isAnchor ? stop.position : paletteStops[index - 1].position + 1
            const max = isAnchor ? stop.position : paletteStops[index + 1].position - 1

            return (
              <div key={stop.id} className="palette-row">
                <input
                  type="color"
                  value={stop.color}
                  onInput={(e) => updatePaletteColor(stop.id, e.target.value)}
                  onChange={(e) => updatePaletteColor(stop.id, e.target.value)}
                  disabled={disabled}
                />

                <label className="palette-position">
                  <span>Position: {stop.position}%</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step="1"
                    value={stop.position}
                    onChange={(e) => updatePalettePosition(stop.id, e.target.value)}
                    disabled={disabled || isAnchor}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => removePaletteStop(stop.id)}
                  disabled={disabled || isAnchor || paletteStops.length <= 2}
                >
                  Remove
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addPaletteStop}
            disabled={disabled || paletteStops.length >= 8}
          >
            + Add Color Stop
          </button>

          <small>First/last stops are locked at 0% and 100%. Max 8 stops.</small>
        </div>
      )}

      <label>
        Intensity: {settings.intensity.toFixed(2)}
        <input
          type="range"
          min="0.4"
          max="2"
          step="0.01"
          value={settings.intensity}
          onChange={(e) => update("intensity", Number(e.target.value))}
          disabled={disabled}
        />
      </label>

      {settings.colorMode === "rainbow" && (
        <>
          <label>
            Hue Shift: {settings.hueShift}
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={settings.hueShift}
              onChange={(e) => update("hueShift", Number(e.target.value))}
              disabled={disabled}
            />
          </label>

          <label className="customizer-toggle">
            <span>Auto-cycle hues</span>
            <input
              type="checkbox"
              checked={settings.autoCycle}
              onChange={(e) => update("autoCycle", e.target.checked)}
              disabled={disabled}
            />
          </label>

          {settings.autoCycle && (
            <label>
              Cycle Speed: {settings.cycleSpeed}°/s
              <input
                type="range"
                min="5"
                max="240"
                step="1"
                value={settings.cycleSpeed}
                onChange={(e) => update("cycleSpeed", Number(e.target.value))}
                disabled={disabled}
              />
            </label>
          )}
        </>
      )}

      <label>
        Glow: {settings.glow}
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={settings.glow}
          onChange={(e) => update("glow", Number(e.target.value))}
          disabled={disabled}
        />
      </label>

      <label>
        Bar Density: {settings.barCount}
        <input
          type="range"
          min="32"
          max="160"
          step="1"
          value={settings.barCount}
          onChange={(e) => update("barCount", Number(e.target.value))}
          disabled={disabled}
        />
      </label>
    </section>
  )
}

export default CustomizerPanel
