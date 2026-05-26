
 import { useEffect, useRef } from "react"
 
 function Visualizer({ analyzerData }) {
   const canvasRef = useRef(null)
   const animationIdRef = useRef(null)
 
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
       ctx.clearRect(0, 0, width, height)
 
       const barWidth = width / bufferLength
       let x = 0
 
       for (let i = 0; i < bufferLength; i++) {
         const barHeight = (dataArray[i] / 255) * height
         ctx.fillStyle = `hsl(${(i / bufferLength) * 360}, 90%, 60%)`
         ctx.fillRect(x, height - barHeight, Math.max(barWidth - 1, 1), barHeight)
         x += barWidth
       }
 
       animationIdRef.current = requestAnimationFrame(draw)
     }
 
     draw()
 
     return () => {
       window.removeEventListener("resize", resizeCanvas)
       if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
     }
   }, [analyzerData])
 
   return (
     <section className="visualizer-wrapper">
       <canvas ref={canvasRef} className="visualizer-canvas" />
     </section>
   )
 }
 
 export default Visualizer
