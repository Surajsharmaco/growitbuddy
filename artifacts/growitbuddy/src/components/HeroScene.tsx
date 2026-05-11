import { useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

function useGlobalMousePosition() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1)
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return { mouseX, mouseY }
}

export function HeroScene() {
  const { mouseX, mouseY } = useGlobalMousePosition()

  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 18 })
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 18 })

  const rotateX = useTransform(smoothY, [-1, 1], [14, -14])
  const rotateY = useTransform(smoothX, [-1, 1], [-14, 14])

  const px1 = useTransform(smoothX, [-1, 1], [-14, 14])
  const py1 = useTransform(smoothY, [-1, 1], [-10, 10])
  const px2 = useTransform(smoothX, [-1, 1], [8, -8])
  const py2 = useTransform(smoothY, [-1, 1], [6, -6])
  const px3 = useTransform(smoothX, [-1, 1], [-6, 6])
  const py3 = useTransform(smoothY, [-1, 1], [10, -10])

  return (
    <div className="w-full h-full flex items-center justify-center select-none">
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: 900,
        }}
        className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96"
      >
        {/* Outermost ring - slow CW */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ x: px1, y: py1 }}
          className="absolute inset-0 rounded-full border border-[#F5E663]/35"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#F5E663]" />
        </motion.div>

        {/* Second ring - medium CCW */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ x: px2, y: py2 }}
          className="absolute inset-8 rounded-full border border-[#F5E663]/20"
        >
          <div className="absolute top-0 right-4 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F5E663]/60" />
        </motion.div>

        {/* Third ring - fast CW, gray */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          style={{ x: px3, y: py3 }}
          className="absolute inset-16 rounded-full border border-gray-200/50"
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-300" />
        </motion.div>

        {/* Innermost pulse orb */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[100px] rounded-full bg-gradient-to-br from-[#F5E663]/25 via-[#F5E663]/8 to-transparent border border-[#F5E663]/25"
        />

        {/* Orbiting accent dot - fast */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F5E663]/80 shadow-[0_0_8px_#F5E663]" />
        </motion.div>

        {/* Orbiting small dot - medium */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute bottom-[14%] right-[18%] w-1.5 h-1.5 rounded-full bg-gray-400/50" />
        </motion.div>

        {/* Top-right corner bracket */}
        <motion.svg
          style={{ x: px1, y: py1 }}
          className="absolute -top-3 -right-3 opacity-25"
          width="56" height="56" viewBox="0 0 56 56" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 0 H56 V56" stroke="#F5E663" strokeWidth="1" fill="none" />
          <path d="M28 0 L56 28" stroke="#F5E663" strokeWidth="0.5" strokeDasharray="3 3" />
        </motion.svg>

        {/* Bottom-left corner bracket */}
        <motion.svg
          style={{ x: px2, y: py2 }}
          className="absolute -bottom-3 -left-3 opacity-15 rotate-180"
          width="44" height="44" viewBox="0 0 44 44" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 0 H44 V44" stroke="#111111" strokeWidth="1" fill="none" />
        </motion.svg>

        {/* Horizontal dashed accent line */}
        <motion.div
          style={{ x: px3 }}
          className="absolute top-1/2 -translate-y-1/2 left-full ml-3 w-12 border-t border-dashed border-[#F5E663]/40 hidden lg:block"
        />
        <motion.div
          style={{ x: px3 }}
          className="absolute top-1/2 -translate-y-1/2 right-full mr-3 w-12 border-t border-dashed border-gray-300/40 hidden lg:block"
        />
      </motion.div>
    </div>
  )
}
