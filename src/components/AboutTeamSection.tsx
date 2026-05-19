import { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import {
  ArrowUpRight,
  Code2,
  Compass,
  HeartHandshake,
  Linkedin,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

type TeamMember = {
  name: string;
  designation: string;
  image: string;
  linkedin: string;
  focus: string;
  accent: string;
};


// Swap these placeholders with official portraits and individual LinkedIn URLs.
const teamMembers: TeamMember[] = [
  {
    name: "Don Benny",
    designation: "Founder & Software Engineer",
    image: "founders/donbenny.webp",
    linkedin: "https://www.linkedin.com/in/donbenny/",
    focus: "Spearheaded the core vision, roadmap, and product direction for OpenBuild Network. Engineered foundational architecture and integrated advanced AI capabilities to drive innovation across the platform.",
    accent: "rgba(45, 212, 191, 0.34)",
  },
  {
    name: "Naveen J Panachinanickal",
    designation: "Co-founder & Software Engineer",
    image: "founders/naveenj.webp",
    linkedin: "https://www.linkedin.com/in/naveenjpanachinanickal/",
    focus: "Architected scalable web tooling and maintained rigorous platform quality standards. Led the development of high-performance frontend interfaces and optimized application infrastructure for maximum reliability.",
    accent: "rgba(96, 165, 250, 0.34)",
  },
  {
    name: "Romeo Roshan",
    designation: "Co-founder & Software Engineer",
    image: "founders/romeoroshan.webp",
    linkedin: "https://www.linkedin.com/in/romeo-roshan-361097321/",
    focus: "Championed privacy-first software architecture and advanced frontend UI development. Integrated complex AI models into user-facing applications while ensuring data security and intuitive user experiences.",
    accent: "rgba(52, 211, 153, 0.34)",
  },
  {
    name: "Ashin Steephan",
    designation: "Co-founder & Software Tester",
    image: "founders/ashinsteephan.webp",
    linkedin: "https://www.linkedin.com/in/ashinsteephan/",
    focus: "Directed Quality Assurance operations and content validation protocols. Implemented comprehensive testing frameworks to identify edge cases, ensuring robust application stability and flawless end-user experiences.",
    accent: "rgba(251, 113, 133, 0.32)",
  },
  {
    name: "Rony Binoy",
    designation: "Co-Founder & Devops Engineer",
    image: "founders/ronybinoy.webp",
    linkedin: "https://www.linkedin.com/in/rony-binoy/",
    focus: "Led development operations and deployment workflows for OpenBuild Network projects, including CI/CD setup, cloud deployment automation, dependency modernization, and platform stability improvements.",
    accent: "rgba(251, 191, 36, 0.32)",
  },
  {
    name: "Fable K Lonappan",
    designation: "Co-Founder & Software Developer",
    image: "founders/fableklonappan.webp",
    linkedin: "https://www.linkedin.com/in/fableklonappan/",
    focus: "Focused on delivering fast, highly accessible, and visually expressive user experiences. Translated complex design system requirements into maintainable, responsive, and cross-browser compatible frontend components.",
    accent: "rgba(34, 211, 238, 0.34)",
  },
  {
    name: "Tony K Sebastian",
    designation: "Co-Founder & Software Developer",
    image: "founders/tonyksebastian.webp",
    linkedin: "https://www.linkedin.com/in/tonyk-sebastian/",
    focus: "Engineered scalable backend infrastructure and robust internal tooling. Prioritized privacy-first architectural decisions to safeguard user data while enhancing the overall performance of OpenBuild Network services.",
    accent: "rgba(129, 140, 248, 0.34)",
  },
  {
    name: "Midhun Krishnan",
    designation: "Co - Founder & Software Developer",
    image: "founders/midhunkrishnan.webp",
    linkedin: "https://www.linkedin.com/in/midhun-krishnan/",
    focus: "Managed comprehensive technical documentation and data pipeline development. Streamlined internal developer onboarding and maintained clear architectural guidelines to accelerate cross-team collaboration.",
    accent: "rgba(244, 114, 182, 0.32)",
  },
  {
    name: "Albert Devasia",
    designation: "Co - Founder & Software Developer",
    image: "founders/albertdevasia.webp",
    linkedin: "https://www.linkedin.com/in/albert-devasia/",
    focus: "Dedicated to privacy-first application development and secure coding practices. Ensured all OpenBuild Network projects complied with strict security standards while contributing to core platform features.",
    accent: "rgba(74, 222, 128, 0.34)",
  },
];

const principles = [
  { Icon: ShieldCheck, label: "Private by design" },
  { Icon: HeartHandshake, label: "Built with care" },
  { Icon: Code2, label: "Open-source first" },
];

const AboutTeamSection = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (selectedMember) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [selectedMember]);

  return (
    <section id="about-us" className="relative overflow-hidden bg-transparent py-32 md:py-44">
      <div className="absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/5 blur-[130px]" />
      <div className="absolute bottom-24 right-0 h-[360px] w-[360px] rounded-full bg-emerald-400/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              <UsersRound className="h-3.5 w-3.5" />
              About OBN
            </span>

            <h2 className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
              Built by people who care about <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">useful, open technology.</span>
            </h2>

            <div className="mt-7 space-y-5 text-sm font-normal leading-relaxed text-white/70 md:text-base">
              <p>
                Open Build Network is shaped by builders, designers, writers, researchers, and community organizers who believe practical tools should stay open, private, and accessible.
              </p>
              <p>
                We keep the work human: clear conversations, transparent decisions, small useful releases, and a culture where newcomers can move from curiosity to contribution.
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {principles.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[10px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 hover:translate-x-1 px-4 py-3 text-sm text-white/80 backdrop-blur-md transition-all duration-300"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-black/35 text-cyan-300 transition-colors duration-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member, index) => (
                <motion.button
                  key={`${member.name}-${member.designation}`}
                  onClick={() => setSelectedMember(member)}
                  aria-label={`View details for ${member.name}`}
                  className="group relative flex flex-col justify-between min-h-[410px] overflow-hidden rounded-[12px] border border-white/10 bg-[#0B0B0F]/90 p-4 text-left shadow-2xl outline-none ring-1 ring-white/[0.03] transition-all duration-300 hover:border-white/25 focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/40 w-full"
                  style={{ "--member-accent": member.accent } as CSSProperties}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.045, ease: "easeOut" }}
                  whileHover={{ y: -7, scale: 1.012 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div
                    className="pointer-events-none absolute -inset-8 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: "var(--member-accent)" }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_58%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative z-10 flex flex-1 flex-col justify-between w-full">
                    <div className="flex flex-col flex-1">
                      
                      {/* Image Container */}
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-white/5">
                        <img
                          src={member.image}
                          alt={`${member.name}, ${member.designation}`}
                          className="h-full w-full object-cover object-top grayscale-[18%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0 will-change-transform"
                          style={{ imageRendering: "-webkit-optimize-contrast" }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/8 to-transparent" />
                      </div>

                      {/* Name & Designation */}
                      <div className="flex flex-1 flex-col pt-4 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold leading-snug tracking-tight text-white group-hover:text-cyan-300 transition-colors duration-300">
                              {member.name}
                            </h3>
                             <div className="mt-1.5 flex flex-col gap-0.5 text-left">
                               <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/90">
                                 {member.designation.split("&")[0].trim()}
                               </span>
                               {member.designation.includes("&") && (
                                 <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/50 group-hover:text-white/70 transition-colors">
                                   {member.designation.split("&")[1].trim()}
                                 </span>
                               )}
                             </div>
                          </div>
                          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/35 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="h-px w-full overflow-hidden bg-white/10">
                        <div className="h-full w-1/3 translate-x-[-120%] bg-cyan-200/70 transition-transform duration-700 group-hover:translate-x-[320%]" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-4 border-t border-white/10 pt-8 text-sm text-white/50 md:grid-cols-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-amber-200" />
            Practical products over empty hype.
          </div>
          <div className="flex items-center gap-3">
            <Compass className="h-4 w-4 text-cyan-200" />
            Direction set in public, with contributors.
          </div>
          <div className="flex items-center gap-3">
            <HeartHandshake className="h-4 w-4 text-rose-200" />
            A warmer path into open-source work.
          </div>
        </motion.div>
      </div>

      {/* Interactive Side Drawer Modal (Rendered in Portal to escape parent CSS transforms/perspective) */}
      {isMounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedMember && (
            <>
              {/* Dark Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={() => setSelectedMember(null)}
                className="fixed inset-0 z-[100] bg-black/75"
              />
              
              {/* Drawer Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.32 }}
                className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-[#0B0B0F]/95 border-l border-white/10 shadow-2xl overflow-y-auto transform-gpu"
                style={{ willChange: "transform" } as CSSProperties}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/10 hover:bg-white/10 transition-colors text-white/70 hover:text-white backdrop-blur-md"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col h-full">
                  {/* Header Image Container with solid bg to prevent loading flash */}
                  <div className="relative h-[360px] w-full shrink-0 bg-[#0C0C12]">
                    <img
                      src={selectedMember.image}
                      alt={selectedMember.name}
                      className="h-full w-full object-cover object-top grayscale-[10%]"
                      style={{ imageRendering: "-webkit-optimize-contrast" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/40 to-transparent" />
                  </div>

                  {/* Drawer Content */}
                  <div className="relative z-10 -mt-24 flex flex-col flex-1 px-8 pb-8">
                    <div>
                      <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                        {selectedMember.name}
                      </h2>
                       <div className="mt-3.5 flex flex-col gap-1 text-left">
                         <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                           {selectedMember.designation.split("&")[0].trim()}
                         </span>
                         {selectedMember.designation.includes("&") && (
                           <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                             {selectedMember.designation.split("&")[1].trim()}
                           </span>
                         )}
                       </div>
                    </div>

                    <div className="mt-12 flex-1">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-cyan-300">
                          <Code2 className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Role & Focus</h3>
                      </div>
                      
                      <p className="mt-6 text-base font-normal leading-relaxed text-white/70">
                        {selectedMember.focus}
                      </p>
                    </div>

                    {/* LinkedIn Button */}
                    <div className="mt-12 pt-6 border-t border-white/10">
                      <a
                        href={selectedMember.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-full items-center justify-center gap-3 rounded-[8px] bg-white/5 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
                      >
                        <Linkedin className="h-4 w-4 text-cyan-300" />
                        Connect on LinkedIn
                        <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

    </section>
  );
};

export default AboutTeamSection;
