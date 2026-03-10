"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function CreativeHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)")
    const useReducedMotion = reducedMotionMedia.matches
    let devicePixelRatio = window.devicePixelRatio || 1
    let animationFrameId = 0
    let render = () => {}

    const setCanvasDimensions = () => {
      devicePixelRatio = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width))
      const height = Math.max(1, Math.floor(rect.height))

      canvas.width = Math.floor(width * devicePixelRatio)
      canvas.height = Math.floor(height * devicePixelRatio)

      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    setCanvasDimensions()
    const handleResize = () => {
      setCanvasDimensions()
      init()
      render()
    }
    window.addEventListener("resize", handleResize)

    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0
    let isPointerInside = false

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
      isPointerInside = true
    }
    const handlePointerLeave = () => {
      isPointerInside = false
    }

    canvas.addEventListener("mousemove", handlePointerMove)
    canvas.addEventListener("mouseleave", handlePointerLeave)

    class Particle {
      x: number
      y: number
      size: number
      baseX: number
      baseY: number
      density: number
      color: string

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.baseX = x
        this.baseY = y
        this.size = Math.random() * 2 + 1.5
        this.density = Math.random() * 20 + 8

        const hue = Math.random() * 40 + 205
        this.color = `hsl(${hue}, 70%, 60%)`
      }

      update() {
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 90

        if (isPointerInside && distance > 0 && distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance
          const directionX = (dx / distance) * force * this.density
          const directionY = (dy / distance) * force * this.density
          this.x -= directionX
          this.y -= directionY
        } else {
          if (this.x !== this.baseX) {
            const dx = this.x - this.baseX
            this.x -= dx / 8
          }
          if (this.y !== this.baseY) {
            const dy = this.y - this.baseY
            this.y -= dy / 8
          }
        }
      }

      draw() {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()
      }
    }

    const particlesArray: Particle[] = []
    const gridSize = 36

    function init() {
      particlesArray.length = 0

      const canvasWidth = canvas.width / devicePixelRatio
      const canvasHeight = canvas.height / devicePixelRatio
      const maxParticles = useReducedMotion ? 40 : 120
      const countX = Math.max(4, Math.floor(canvasWidth / gridSize))
      const countY = Math.max(3, Math.floor(canvasHeight / gridSize))
      const numY = Math.min(countY, Math.max(3, Math.floor(maxParticles / countX)))
      const numX = Math.min(countX, maxParticles)

      for (let y = 0; y < numY; y++) {
        for (let x = 0; x < numX; x++) {
          if (particlesArray.length >= maxParticles) return
          const posX = x * gridSize + gridSize / 2
          const posY = y * gridSize + gridSize / 2
          particlesArray.push(new Particle(posX, posY))
        }
      }
    }

    init()

    render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const maxConnectionDistance = 26
      const maxConnectionDistanceSq = maxConnectionDistance * maxConnectionDistance
      const neighborLimit = 8

      mouseX += (targetX - mouseX) * 0.1
      mouseY += (targetY - mouseY) * 0.1

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update()
        particlesArray[i].draw()

        const maxJ = Math.min(particlesArray.length, i + neighborLimit)
        for (let j = i + 1; j < maxJ; j++) {
          const dx = particlesArray[i].x - particlesArray[j].x
          const dy = particlesArray[i].y - particlesArray[j].y
          const distanceSq = dx * dx + dy * dy

          if (distanceSq < maxConnectionDistanceSq) {
            const alpha = 0.18 - distanceSq / (maxConnectionDistanceSq * 1.3)
            ctx.beginPath()
            ctx.strokeStyle = `rgba(59, 130, 246, ${Math.max(alpha, 0.04)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y)
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      render()
      animationFrameId = requestAnimationFrame(animate)
    }

    if (useReducedMotion) {
      render()
    } else {
      animate()
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
      canvas.removeEventListener("mousemove", handlePointerMove)
      canvas.removeEventListener("mouseleave", handlePointerLeave)
    }
  }, [])

  return (
    <motion.div
      className="w-full h-[400px] md:h-[500px] relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
    </motion.div>
  )
}
