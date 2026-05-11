import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

function isFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

export default function CustomCursor() {
  const [isTouch] = useState(() => !isFinePointer());
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springX = useSpring(mouseX, { stiffness: 120, damping: 20, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20, mass: 0.5 });

  const dotX = useSpring(mouseX, { stiffness: 400, damping: 30, mass: 0.2 });
  const dotY = useSpring(mouseY, { stiffness: 400, damping: 30, mass: 0.2 });

  useEffect(() => {
    if (isTouch) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const onEnter = () => setHovering(true);
    const onLeave = () => setHovering(false);
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    const els = document.querySelectorAll("a, button, [data-cursor-hover]");
    els.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    const observer = new MutationObserver(() => {
      const newEls = document.querySelectorAll("a, button, [data-cursor-hover]");
      newEls.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      observer.disconnect();
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      {/* Large ring cursor */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
        }}
        animate={{
          width: hovering ? 60 : clicking ? 28 : 40,
          height: hovering ? 60 : clicking ? 28 : 40,
          opacity: visible ? 1 : 0,
          backgroundColor: hovering ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          border: hovering ? "1.5px solid rgba(255,255,255,0)" : "1.5px solid rgba(255,255,255,1)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="rounded-full"
      />
      {/* Dot */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 10000,
          width: 5,
          height: 5,
          borderRadius: "50%",
          mixBlendMode: "difference",
        }}
        animate={{ opacity: visible ? 1 : 0, backgroundColor: "#ffffff" }}
        transition={{ duration: 0.1 }}
      />
    </>
  );
}
