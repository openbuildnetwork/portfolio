import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
}

const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const particleCount = 45;
    const maxDistance = 90;
    const mouseRadius = 140;

    // Handle Window Resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize Particles
    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = Math.random() * 0.4 + 0.15;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.8,
        alpha: baseAlpha,
        baseAlpha: baseAlpha
      });
    }

    // Tracks Cursor coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = {
        x: null,
        y: null
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Render Animation Loop
    const render = () => {
      // Pause drawing when body scroll is locked (e.g. side drawer modal is open)
      if (document.body.style.overflow === "hidden") {
        animationId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update and Draw Particles
      particles.forEach((p, idx) => {
        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off canvas boundaries
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Interactive Cursor deflection
        if (mx !== null && my !== null) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius) {
            const force = (mouseRadius - dist) / mouseRadius;
            const angle = Math.atan2(dy, dx);
            // Soft push effect
            p.x += Math.cos(angle) * force * 1.2;
            p.y += Math.sin(angle) * force * 1.2;
            p.alpha = Math.min(0.8, p.baseAlpha + force * 0.4);
          } else {
            // Decay back to base opacity
            if (p.alpha > p.baseAlpha) {
              p.alpha -= 0.01;
            }
          }
        }

        // Draw individual particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();

        // Trace connections between nodes close to each other
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            let lineAlpha = (maxDistance - dist) / maxDistance * 0.06;

            // Highlight lines near the active mouse pointer
            if (mx !== null && my !== null) {
              const mdx1 = p.x - mx;
              const mdy1 = p.y - my;
              const mdist1 = Math.sqrt(mdx1 * mdx1 + mdy1 * mdy1);

              const mdx2 = p2.x - mx;
              const mdy2 = p2.y - my;
              const mdist2 = Math.sqrt(mdx2 * mdx2 + mdy2 * mdy2);

              if (mdist1 < mouseRadius && mdist2 < mouseRadius) {
                const glowBonus = (1 - (mdist1 + mdist2) / (mouseRadius * 2)) * 0.12;
                lineAlpha += glowBonus;
              }
            }

            // Draw link path
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    // Cleanups
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#030303]">
      
      {/* Dynamic ambient background nebulae */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-primary/10 rounded-full blur-[140px] mix-blend-screen pointer-events-none opacity-40"
        style={{
          animation: "float-nebula-a 25s ease-in-out infinite",
        }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] bg-emerald-500/10 rounded-full blur-[140px] mix-blend-screen pointer-events-none opacity-40"
        style={{
          animation: "float-nebula-b 28s ease-in-out infinite",
        }}
      />
      <div 
        className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[160px] mix-blend-screen pointer-events-none opacity-50"
        style={{
          animation: "float-nebula-c 22s ease-in-out infinite",
        }}
      />

      {/* Cybernetic HUD Grid Pattern with subtle radial vignette */}
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/60 to-[#030303] pointer-events-none" />

      {/* Connection Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {/* Internal stylesheet defining floating nebulae transforms */}
      <style>{`
        @keyframes float-nebula-a {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(120px, 80px) scale(1.15); }
        }
        @keyframes float-nebula-b {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-140px, -60px) scale(0.9); }
        }
        @keyframes float-nebula-c {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(80px, -100px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default StarBackground;
