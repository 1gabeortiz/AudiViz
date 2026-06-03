import { useEffect, useRef } from "react"

const BAR_COUNT = 96
const MAX_BAR_COUNT = 160
const SMOOTHING = 0.18 // lower = smoother, higher = more reactive

function Visualizer({ analyzerData, mode = "bars", settings }) {
  const canvasRef = useRef(null)
  const animationIdRef = useRef(null)
  const smoothedDataRef = useRef(new Float32Array(MAX_BAR_COUNT))
  const intensity = settings?.intensity ?? 1
  const hueShift = settings?.hueShift ?? 0
  const glow = settings?.glow ?? 14
  const dynamicBarCount = settings?.barCount ?? BAR_COUNT

  useEffect(() => {
    if (!analyzerData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const { analyser, dataArray, bufferLength } = analyzerData

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    function draw() {
      analyser.getByteFrequencyData(dataArray)

      const width = canvas.clientWidth
      const height = canvas.clientHeight

      // trail/fade effect
      ctx.fillStyle = "rgba(10, 10, 10, 0.22)"
      ctx.fillRect(0, 0, width, height)

      const step = Math.floor(bufferLength / dynamicBarCount) || 1
      const barWidth = width / dynamicBarCount

      if (mode === "bars") {
        for (let i = 0; i < dynamicBarCount; i++) {
          const sourceIndex = i * step
          const raw = (dataArray[sourceIndex] || 0) / 255
          const prev = smoothedDataRef.current[i]
          const smooth = prev + (raw - prev) * SMOOTHING
          smoothedDataRef.current[i] = smooth

          const barHeight = smooth * height * 0.9 * intensity
          const x = i * barWidth
          const hue = ((i / dynamicBarCount) * 320 + 20 + hueShift) % 360

          ctx.fillStyle = `hsla(${hue}, 92%, 62%, 0.95)`
          ctx.shadowBlur = glow
          ctx.shadowColor = `hsla(${hue}, 92%, 62%, 0.65)`
          ctx.fillRect(x, height - barHeight, Math.max(barWidth - 2, 1), barHeight)
        }
      } else {
        const cx = width / 2
        const cy = height / 2
        const baseRadius = Math.min(width, height) * 0.18

        ctx.save()
        ctx.translate(cx, cy)

        const HALF_BARS = Math.max(2, Math.floor(dynamicBarCount / 2))

        for (let i = 0; i < HALF_BARS; i++) {
          const sourceIndex = Math.floor(i * step)

          // Bass attenuation + mild treble lift
          const bassTame = 0.65 + (i / HALF_BARS) * 0.45
          const raw = ((dataArray[sourceIndex] || 0) / 255) * bassTame * intensity

          const prev = smoothedDataRef.current[i]
          const smooth = prev + (raw - prev) * SMOOTHING
          smoothedDataRef.current[i] = smooth

          const angle = (i / HALF_BARS) * Math.PI
          const length = 20 + smooth * (Math.min(width, height) * 0.28)
          const hue = ((i / HALF_BARS) * 320 + 20 + hueShift) % 360

          const x1 = Math.cos(angle) * baseRadius
          const y1 = Math.sin(angle) * baseRadius
          const x2 = Math.cos(angle) * (baseRadius + length)
          const y2 = Math.sin(angle) * (baseRadius + length)

          ctx.strokeStyle = `hsla(${hue}, 92%, 62%, 0.95)`
          ctx.lineWidth = 2
          ctx.shadowBlur = glow
          ctx.shadowColor = `hsla(${hue}, 92%, 62%, 0.65)`
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()

          const mirrorAngle = angle + Math.PI
          const mx1 = Math.cos(mirrorAngle) * baseRadius
          const my1 = Math.sin(mirrorAngle) * baseRadius
          const mx2 = Math.cos(mirrorAngle) * (baseRadius + length)
          const my2 = Math.sin(mirrorAngle) * (baseRadius + length)

          ctx.beginPath()
          ctx.moveTo(mx1, my1)
          ctx.lineTo(mx2, my2)
          ctx.stroke()
        }

        ctx.restore()
      }

      ctx.shadowBlur = 0
      animationIdRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
    }
  }, [analyzerData, mode, dynamicBarCount, glow, hueShift, intensity])

  return (
    <section className="visualizer-wrapper">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </section>
  )
}

export default Visualizer
