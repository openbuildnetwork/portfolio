import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Sparkles, Terminal, Activity, Heart, ShieldCheck, Users } from "lucide-react";
import Marquee from "./Marquee";
import DarkVeil from "./DarkVeil";
import LightPillar from "./LightPillar";
import ShinyText from "./ShinyText";
import { motion } from "framer-motion";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [isMemberCountLoading, setIsMemberCountLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayMemberCount =
    memberCount !== null ? (memberCount > 12 ? memberCount : 12) : 12;

  // Fetch total registered member count from Supabase
  useEffect(() => {
    const fetchMemberCount = async () => {
      setIsMemberCountLoading(true);
      try {
        const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
        if (!isSupabaseConfigured()) return;
        const { count, error } = await supabase
          .from("alliance_members")
          .select("*", { count: "exact", head: true });
        if (!error && count !== null) {
          setMemberCount(count);
        }
      } catch (err) {
        console.error("Failed to fetch member count:", err);
      } finally {
        setIsMemberCountLoading(false);
      }
    };
    fetchMemberCount();

    // Refresh count when a new member joins
    const handleRefresh = () => fetchMemberCount();
    window.addEventListener("obn_alliance_joined", handleRefresh);
    return () => window.removeEventListener("obn_alliance_joined", handleRefresh);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setMousePosition({ x, y });
  };

  return (
    <div
      className="relative overflow-hidden min-h-screen flex flex-col items-center justify-between"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* DarkVeil fluid organic background - deep space backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DarkVeil
          speed={0.8}
          scanlineFrequency={0.2}
          noiseIntensity={0.02}
          scanlineIntensity={0.15}
          warpAmount={0.3}
        />
        {/* Dark overlay to keep text extremely readable */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
      </div>

      {/* Cybernetic grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none z-0" />

      {/* Ambient Cursor Glows */}
      <div
        className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-primary/10 rounded-full blur-[130px] pointer-events-none transition-transform duration-500 ease-out z-0"
        style={{
          transform: `translate(${mousePosition.x * -70}px, ${mousePosition.y * -70}px)`,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none transition-transform duration-500 ease-out z-0"
        style={{
          transform: `translate(${mousePosition.x * 70}px, ${mousePosition.y * 70}px)`,
        }}
      />

      {/* Hero Content Area */}
      <section className="relative z-10 w-full flex flex-col items-center justify-center pt-32 pb-16 px-4 flex-grow">

        <div className="container max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 md:gap-24 relative">

          {/* Left Column: Breathtaking typography & values */}
          <div className="lg:w-1/2 flex flex-col items-start text-left space-y-8 animate-fade-up">



            {/* Futuristic Headline with Shiny gradient text */}
            <div className="space-y-4 max-w-xl">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
                Building the <br />
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-cyan-400 animate-gradient-text">
                    future
                  </span>
                </span> of <br />
                <ShinyText text="open collaboration." className="font-extrabold text-white" speed={3} />
              </h1>

              <p className="text-base md:text-lg text-white/50 font-light leading-relaxed">
                Join a decentralized, transparent platform where cutting-edge technology empowers individuals, respects total privacy, and stays permanently open to all.
              </p>
            </div>

            {/* Cybernetic Telemetry Data readout */}
            <div className="grid grid-cols-3 gap-6 py-4 px-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm w-full max-w-md font-mono text-[10px] text-white/40">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider block text-white/20">LATENCY</span>
                <span className="text-sm font-bold text-primary flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  0ms <span className="text-[8px] text-white/30">(Client)</span>
                </span>
              </div>
              <div className="space-y-1 border-l border-white/5 pl-6">
                <span className="text-[9px] uppercase tracking-wider block text-white/20">SOVEREIGNTY</span>
                <span className="text-sm font-bold text-cyan-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  100%
                </span>
              </div>
              <div className="space-y-1 border-l border-white/5 pl-6">
                <span className="text-[9px] uppercase tracking-wider block text-white/20">ALLIANCE</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  {isMemberCountLoading ? (
                    <span
                      className="inline-block min-w-[1.25rem] h-3.5 rounded bg-white/10 animate-pulse"
                      aria-hidden
                    />
                  ) : (
                    displayMemberCount
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Mind-blowing Interactive Volumetric Hologram Core */}
          <div className="lg:w-1/2 w-full flex items-center justify-center pt-8 lg:pt-0">

            <div className="relative w-[340px] h-[340px] md:w-[440px] md:h-[440px] flex items-center justify-center select-none">

              {/* Telemetry Outer Rotator Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-white/5 animate-spin-slow pointer-events-none" />

              {/* Tech tick marks SVG ring */}
              <svg className="absolute inset-4 w-full h-full pointer-events-none transform -translate-x-4 -translate-y-4 opacity-25">
                <circle cx="50%" cy="50%" r="44%" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="1 8" fill="none" />
                <circle cx="50%" cy="50%" r="40%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="6 200" fill="none" />
              </svg>

              {/* Animated Orbital Nodes */}
              <div className="absolute inset-8 rounded-full border border-white/10 pointer-events-none">
                <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#8B5CF6]" />
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-cyan-400 rounded-full -translate-x-1/2 translate-y-1/2 shadow-[0_0_15px_#06B6D4]" />
              </div>

              {/* Central Hologram Viewing Screen Dome */}
              <div className="absolute w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-full overflow-hidden bg-black/60 border border-primary/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] ring-1 ring-white/10 flex items-center justify-center group cursor-grab active:cursor-grabbing">

                {/* Embedded Volumetric LightPillar Shader */}
                <LightPillar
                  topColor="#8B5CF6"
                  bottomColor="#06B6D4"
                  intensity={1.25}
                  rotationSpeed={0.8}
                  interactive={true}
                  glowAmount={0.007}
                  pillarWidth={3.8}
                  pillarHeight={0.35}
                  noiseIntensity={0.65}
                />

                {/* Cybernetic Scanlines overlay */}
                <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none opacity-60" />

                {/* HUD Lock Overlay */}
                <div className="absolute inset-6 border border-white/5 rounded-full pointer-events-none flex items-center justify-center">
                  <div className="w-8 h-8 border border-primary/25 rounded-full animate-ping" />
                </div>
              </div>

              {/* Outer compass telemetry tags */}
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-full font-mono text-[9px] text-white/20 uppercase tracking-widest pointer-events-none">
                CORE_VOLUMETRIC_PORT: 5173
              </div>
              <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-full font-mono text-[8px] text-white/30 flex items-center gap-1.5 pointer-events-none">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span>GRID SYSTEM SYNCHRONIZED</span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Marquee Ticker - flows smoothly into next section */}
      <div className="w-full relative z-10 pb-8 overflow-hidden pointer-events-none">
        <Marquee />
      </div>
    </div>
  );
};

export default Hero;
