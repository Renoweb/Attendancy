'use client'
import { useEffect, useRef } from 'react'

export default function BackgroundHex() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let width, height
        let hexSize = 70
        let sparks = []

        const resize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }
        window.addEventListener('resize', resize)
        resize()

        const grid = []
        const vert = Math.sqrt(3) * hexSize
        for (let row = -1; row < height / vert + 2; row++) {
            for (let col = -1; col < width / (1.5 * hexSize) + 2; col++) {
                const x = col * 1.5 * hexSize
                const y = row * vert + (col % 2 === 0 ? 0 : vert / 2)
                grid.push({ x, y })
            }
        }

        class Spark {
            constructor() {
                const hex = grid[Math.floor(Math.random() * grid.length)]
                this.x = hex.x
                this.y = hex.y
                this.angle = Math.random() * Math.PI * 2
                this.speed = 1 + Math.random()
                this.life = 0
                this.maxLife = 200 + Math.random() * 100
            }
            move() {
                this.x += Math.cos(this.angle) * this.speed
                this.y += Math.sin(this.angle) * this.speed
                this.life++
                if (this.life > this.maxLife) {
                    const hex = grid[Math.floor(Math.random() * grid.length)]
                    this.x = hex.x
                    this.y = hex.y
                    this.life = 0
                }
            }
            draw() {
                ctx.beginPath()
                ctx.arc(this.x, this.y, 2, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(0,153,255,0.9)'
                ctx.fill()
            }
        }

        for (let i = 0; i < 100; i++) sparks.push(new Spark())

        function drawHex(x, y, radius) {
            ctx.beginPath()
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i
                const x_i = x + radius * Math.cos(angle)
                const y_i = y + radius * Math.sin(angle)
                i === 0 ? ctx.moveTo(x_i, y_i) : ctx.lineTo(x_i, y_i)
            }
            ctx.closePath()
        }

        function animate() {
            ctx.clearRect(0, 0, width, height)

            // Hex grid
            ctx.strokeStyle = 'rgba(0, 140, 255, 0.1)'
            ctx.lineWidth = 1
            grid.forEach(({ x, y }) => {
                ctx.save()
                ctx.translate(x + width / 10, y + height / 10)
                drawHex(0, 0, hexSize)
                ctx.stroke()
                ctx.restore()
            })

            // Blue Blobs
            const time = Date.now() * 0.001
            for (let i = 0; i < 2; i++) {
                const blobX = (Math.sin(time + i) * 0.4 + 0.5) * width
                const blobY = (Math.cos(time + i * 2) * 0.4 + 0.5) * height
                const gradient = ctx.createRadialGradient(blobX, blobY, 0, blobX, blobY, 250)
                gradient.addColorStop(0, 'rgba(0,150,255,0.25)')
                gradient.addColorStop(1, 'rgba(0,150,255,0)')
                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(blobX, blobY, 250, 0, Math.PI * 2)
                ctx.fill()
            }

            // Sparks
            sparks.forEach((s) => {
                s.move()
                s.draw()
            })

            requestAnimationFrame(animate)
        }

        animate()
        return () => window.removeEventListener('resize', resize)
    }, [])

    return <canvas ref={canvasRef} className="absolute inset-0 z-0" />
}
