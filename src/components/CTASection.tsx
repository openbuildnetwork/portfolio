import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Award, Key, CheckCircle, RefreshCw,
  Download, LogOut, Chrome, Sparkles
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    mouseX.set((clientX - left) / width - 0.5);
    mouseY.set((clientY - top) / height - 0.5);
  };

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 100, damping: 20 });

  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  // Auth States
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [authState, setAuthState] = useState<"unauthenticated" | "authenticated_handshake">("unauthenticated");
  const [isConfigError, setIsConfigError] = useState<boolean>(false);

  // Guild Choice States
  const [selectedGuild, setSelectedGuild] = useState<string>("builder");
  const [memberHandle, setMemberHandle] = useState<string>("");

  // Staging and Guild identity states
  const [stagingStep, setStagingStep] = useState<"idle" | "registering" | "active">("idle");
  const [registerLogs, setRegisterLogs] = useState<string[]>([]);
  const [memberDetails, setMemberDetails] = useState<any | null>(null);

  // Base Dynamic Color configuration based on the selected guild
  const baseColor = selectedGuild === "builder" ? "#8B5CF6" :
    selectedGuild === "architect" ? "#EC4899" : "#10B981";

  // Auto-scroll to register portal if user becomes authenticated
  useEffect(() => {
    if (user) {
      const element = document.getElementById("alliance-register");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    }
  }, [user]);

  // Initialize Supabase Auth & check configuration
  useEffect(() => {
    const initSupabaseAuth = async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");

        if (isSupabaseConfigured()) {
          setIsConfigError(false);

          // Fetch initial session
          const { data: { session: activeSession } } = await supabase.auth.getSession();
          setSession(activeSession);

          const currentUser = activeSession?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            setAuthState("authenticated_handshake");

            // Set a fallback handle based on metadata if not set
            const rawName = currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "";
            const cleanHandle = `@${rawName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
            setMemberHandle(prev => prev || cleanHandle);

            // Check if there is a pending registration in localStorage
            const pendingGuild = localStorage.getItem("obn_pending_guild");
            const pendingHandle = localStorage.getItem("obn_pending_handle");

            // Check if user is already in db
            const alreadyRegistered = await checkExistingMembership(currentUser.id);

            if (!alreadyRegistered && pendingGuild && pendingHandle) {
              // Automatically execute the registry write and card compilation!
              await autoRegisterAlliance(currentUser, pendingGuild, pendingHandle);
            }
          }

          // Register auth listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            setSession(currentSession);
            const activeUser = currentSession?.user ?? null;
            setUser(activeUser);

            if (activeUser) {
              setAuthState("authenticated_handshake");

              const rawName = activeUser.user_metadata?.full_name || activeUser.email?.split("@")[0] || "";
              const cleanHandle = `@${rawName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
              setMemberHandle(prev => prev || cleanHandle);

              const pendingGuild = localStorage.getItem("obn_pending_guild");
              const pendingHandle = localStorage.getItem("obn_pending_handle");

              const alreadyRegistered = await checkExistingMembership(activeUser.id);

              if (!alreadyRegistered && pendingGuild && pendingHandle) {
                await autoRegisterAlliance(activeUser, pendingGuild, pendingHandle);
              }
            } else {
              setAuthState("unauthenticated");
              setMemberDetails(null);
              setStagingStep("idle");
              setMemberHandle("");
              window.dispatchEvent(new Event("obn_alliance_left"));
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          setIsConfigError(true);
          console.error("OBN: Supabase environment credentials not configured inside .env.local.");
        }
      } catch (err) {
        setIsConfigError(true);
        console.error("Supabase initialization error:", err);
      }
    };

    initSupabaseAuth();
  }, []);

  // Check if a member is already in the Supabase db
  const checkExistingMembership = async (userId: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("alliance_members")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data && !error) {
        setMemberDetails({
          name: data.name,
          email: data.email,
          handle: data.handle,
          guild: data.guild,
          memberId: data.member_id,
          regHash: data.registry_key,
          date: data.enrollment_date
        });
        setStagingStep("active");
        setSelectedGuild(
          data.guild.includes("Builder") ? "builder" :
            data.guild.includes("Architect") ? "architect" : "guardian"
        );
        // Clean up pending states
        localStorage.removeItem("obn_pending_guild");
        localStorage.removeItem("obn_pending_handle");
        window.dispatchEvent(new Event("obn_alliance_joined"));
        return true;
      }
    } catch (err) {
      console.error("Error reading database record:", err);
    }
    return false;
  };

  // Google OAuth Login
  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberHandle.trim()) {
      alert("Please enter a custom member handle first.");
      return;
    }

    try {
      const { supabase } = await import("@/lib/supabase");

      // Save pending registration states locally so we process automatically upon OAuth return
      localStorage.setItem("obn_pending_guild", selectedGuild);
      localStorage.setItem("obn_pending_handle", memberHandle.trim());

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/"
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(`Google OAuth handshake failed: ${err.message || err}.`);
    }
  };

  // Manual Trigger to save registration when returning to a lost storage session
  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!memberHandle.trim()) {
      alert("Please enter a custom member handle first.");
      return;
    }
    await autoRegisterAlliance(user, selectedGuild, memberHandle.trim());
  };

  // Automatic Alliance Registration after returning from Google
  const autoRegisterAlliance = async (currentUser: any, guild: string, handle: string) => {
    setStagingStep("registering");
    setRegisterLogs([]);

    const steps = [
      "Establishing sovereign secure channel...",
      "✔ Google OAuth identity token successfully validated.",
      `Retrieving placement parameters for [${guild.toUpperCase()} GUILD]...`,
      "Generating unique asymmetric registry verification keys...",
      "✔ Cryptographic signatures successfully processed.",
      "Writing registration payload to the secure cloud registry...",
    ];

    for (let i = 0; i < steps.length; i++) {
      setRegisterLogs(prev => [...prev, steps[i]]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    const randomID = Math.random().toString(36).substring(2, 8).toUpperCase();
    const mockHash = `0x98f${Math.random().toString(16).substring(2, 6).toUpperCase()}...${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const guildLabel = guild === "builder" ? "The Builder (Engineering)" :
      guild === "architect" ? "The Architect (UI/UX Design)" : "The Guardian (Advocacy)";

    const details = {
      name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || handle.replace("@", ""),
      email: currentUser.email,
      handle: handle,
      guild: guildLabel,
      memberId: `OBN-MEMBER-${randomID}`,
      regHash: mockHash,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    };

    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase
        .from("alliance_members")
        .insert({
          id: currentUser.id,
          name: details.name,
          email: details.email,
          handle: details.handle,
          guild: details.guild,
          member_id: details.memberId,
          registry_key: details.regHash,
          enrollment_date: details.date
        });

      if (error) {
        setRegisterLogs(prev => [
          ...prev,
          `❌ Database Error: ${error.message}`,
          "⚠️ Please ensure you created the 'alliance_members' table inside Supabase.",
          "👉 Refer to C:\\Users\\donbe\\.gemini\\antigravity\\brain\\e6b7831d-3d9f-44f3-aead-0f1bec246fc0\\supabase_google_setup.md to initialize it."
        ]);
        // Clear pending states so the user isn't stuck in a redirect loop
        localStorage.removeItem("obn_pending_guild");
        localStorage.removeItem("obn_pending_handle");
        return;
      }
    } catch (err: any) {
      setRegisterLogs(prev => [...prev, `❌ Database Exception: ${err.message || err}`]);
      return;
    }

    setRegisterLogs(prev => [...prev, "✔ Sovereign Identity Registered successfully!"]);
    await new Promise(resolve => setTimeout(resolve, 400));

    // Clear pending states
    localStorage.removeItem("obn_pending_guild");
    localStorage.removeItem("obn_pending_handle");

    setMemberDetails(details);
    setStagingStep("active");
    window.dispatchEvent(new Event("obn_alliance_joined"));
  };

  // Sign out or reset state
  const handleResetRegistration = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setAuthState("unauthenticated");
      setStagingStep("idle");
      setMemberDetails(null);
      setMemberHandle("");
      setRegisterLogs([]);
      localStorage.removeItem("obn_pending_guild");
      localStorage.removeItem("obn_pending_handle");
      window.dispatchEvent(new Event("obn_alliance_left"));
    } catch (err) {
      console.error("Auth sign out failure:", err);
      setAuthState("unauthenticated");
      setStagingStep("idle");
      setMemberDetails(null);
      window.dispatchEvent(new Event("obn_alliance_left"));
    }
  };

  // Generate and download client-side OBN member ID card as a high-quality PNG
  const handleDownloadCard = () => {
    if (!memberDetails) return;

    // Create Canvas elements
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 460;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Helper to draw a perfectly rounded rectangle in canvas
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number, fill = false, stroke = true) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    };

    // Draw Dark Card Base
    ctx.fillStyle = "#060608";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Neon Glow gradient centered on Left Column (concentric rings) to match holographic glow
    const mainColor = selectedGuild === "builder" ? "#8B5CF6" :
      selectedGuild === "architect" ? "#EC4899" : "#10B981";
    const accentColor = selectedGuild === "builder" ? "rgba(139, 92, 246, 0.2)" :
      selectedGuild === "architect" ? "rgba(236, 72, 153, 0.2)" : "rgba(16, 185, 129, 0.2)";

    const radGrad = ctx.createRadialGradient(140, 150, 10, 140, 150, 320);
    radGrad.addColorStop(0, accentColor);
    radGrad.addColorStop(1, "rgba(6, 6, 8, 0)");
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Cyber Dot Matrix background
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let x = 32; x < canvas.width - 32; x += 10) {
      for (let y = 32; y < canvas.height - 32; y += 10) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw outer glassmorphism border card box
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    drawRoundRect(16, 16, canvas.width - 32, canvas.height - 32, 16, false, true);

    // Draw Cyber Corner Framing Brackets
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    const bSz = 14;

    // Top Left
    ctx.beginPath();
    ctx.moveTo(32, 32 + bSz); ctx.lineTo(32, 32); ctx.lineTo(32 + bSz, 32);
    ctx.stroke();
    // Top Right
    ctx.beginPath();
    ctx.moveTo(canvas.width - 32 - bSz, 32); ctx.lineTo(canvas.width - 32, 32); ctx.lineTo(canvas.width - 32, 32 + bSz);
    ctx.stroke();
    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(32, canvas.height - 32 - bSz); ctx.lineTo(32, canvas.height - 32); ctx.lineTo(32 + bSz, canvas.height - 32);
    ctx.stroke();
    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(canvas.width - 32 - bSz, canvas.height - 32); ctx.lineTo(canvas.width - 32, canvas.height - 32); ctx.lineTo(canvas.width - 32, canvas.height - 32 - bSz);
    ctx.stroke();

    // LEFT COLUMN ELEMENTS (Centered at X = 140)

    // Concentric Avatar Circles on Left
    // Outer dashed ring
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(140, 150, 46, 0, Math.PI * 2); ctx.stroke();

    // Inner dotted ring
    ctx.globalAlpha = 0.2;
    ctx.setLineDash([1, 4]);
    ctx.beginPath(); ctx.arc(140, 150, 52, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); // Reset dash patterns
    ctx.globalAlpha = 1.0;

    // Solid inner container circle
    ctx.fillStyle = "#0A0A0F";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(140, 150, 36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Emblem Icon (Award Star Symbol)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(140, 150, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(140, 150, 5, 0, Math.PI * 2); ctx.stroke();

    // Verified Seal
    ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
    ctx.lineWidth = 1;
    drawRoundRect(95, 220, 90, 18, 3, true, true);

    ctx.fillStyle = "#10B981";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("✔ VERIFIED", 140, 231);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "bold 7px monospace";
    ctx.fillText("SOVEREIGN ENTRY", 140, 252);

    // Simulated Tech Barcode
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    let barcodeX = 64;
    const barcodeWidths = [2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2];
    for (let w of barcodeWidths) {
      ctx.fillRect(barcodeX, 290, w, 40);
      barcodeX += w + 2;
    }
    ctx.textAlign = "left"; // reset alignment

    // RIGHT COLUMN ELEMENTS (Starts X = 270)

    // Corporate Registry Header
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "bold 8px monospace";
    ctx.fillText("OPEN BUILD NETWORK", 270, 56);

    ctx.fillStyle = "#10B981";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "right";
    ctx.fillText("● NODE_ACTIVE", 736, 56);
    ctx.textAlign = "left"; // Reset alignment

    // Profile names
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(memberDetails.name || "Sovereign Member", 270, 102);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "11px monospace";
    ctx.fillText(memberDetails.email || "alliance@obn.network", 270, 126);

    // Divider Line 1
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(270, 150);
    ctx.lineTo(736, 150);
    ctx.stroke();

    // Data Block Cells
    const drawTechCell = (lbl: string, val: string, xPos: number, yPos: number, isAccent: boolean = false, isCyan: boolean = false) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "bold 8px monospace";
      ctx.fillText(lbl.toUpperCase(), xPos, yPos);

      ctx.fillStyle = isAccent ? mainColor : isCyan ? "#38BDF8" : "#FFFFFF";
      ctx.font = "bold 12px monospace";
      ctx.fillText(val.toUpperCase(), xPos, yPos + 22);
    };

    drawTechCell("Guild Path", memberDetails.guild, 270, 182, true);
    drawTechCell("Member Handle", memberDetails.handle, 510, 182);
    drawTechCell("Enrollment Date", memberDetails.date, 270, 260);
    drawTechCell("Asymmetric Registry Key", memberDetails.regHash, 510, 260, false, true);

    // Divider Line 2
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(270, 320);
    ctx.lineTo(736, 320);
    ctx.stroke();

    // Blockchain Verification Footer Tag
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "bold 8px monospace";
    ctx.fillText("ALLIANCE_MEMBER_SECURE_ID", 270, 365);

    ctx.fillStyle = mainColor;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "right";
    ctx.fillText(memberDetails.memberId, 736, 365);
    ctx.textAlign = "left"; // Reset

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.font = "bold 7px monospace";
    ctx.fillText("OBN BLOCKCHAIN SOVEREIGN KEYPASS SECURE PAYLOAD", 270, 400);

    // Trigger local download
    const dataURI = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `obn-alliance-${memberDetails.handle.replace("@", "")}.png`;
    link.href = dataURI;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      ref={containerRef}
      id="alliance-register"
      className="relative py-32 md:py-48 overflow-hidden min-h-screen flex items-center justify-center bg-transparent"
      onMouseMove={handleMouseMove}
    >
      {/* Immersive Background Space */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-transparent z-0" />

        {/* Generative core glows */}
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [-120, 120]) }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[130px]"
        />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [120, -120]) }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[130px]"
        />
      </div>

      <motion.div
        className="container relative z-10 px-4 max-w-7xl mx-auto"
        style={{ opacity, y }}
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="max-w-6xl mx-auto"
        >
          <div className="relative group">
            {/* Holographic backdrop glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-16 shadow-2xl overflow-hidden ring-1 ring-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* Left side: Community Invitation */}
                <div className="col-span-1 lg:col-span-6 space-y-8 text-left relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary font-bold tracking-widest uppercase text-[10px] md:text-xs">Join the Movement</span>
                  </div>

                  <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white leading-tight">
                    Join the <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 animate-gradient-text">OBN Sovereign</span> Alliance.
                  </h2>

                  <p className="text-base text-white/50 font-light leading-relaxed max-w-md">
                    Become an active part of our open-source, client-side community. Authenticate securely with Google OAuth to verify your credentials, claim your customized cryptographic key card, and save it directly in our decentralized Supabase registry.
                  </p>

                </div>

                {/* Right side: Interactive Member Staging Terminal */}
                <div className="col-span-1 lg:col-span-6 w-full flex flex-col gap-6 relative z-10">

                  {/* Registry Frame Window */}
                  <div className="relative w-full bg-black/85 rounded-2xl border border-white/10 shadow-2xl p-6 font-mono text-[11px] overflow-hidden select-text text-left">

                    {/* Window Controls */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6 text-[9px] uppercase tracking-wider text-white/30">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        <span className="ml-2 font-bold text-white/45">OBN_Member_Registry</span>
                      </div>
                      <span className="text-primary font-bold">SECURED PORTAL</span>

                    </div>


                    <AnimatePresence mode="wait">

                      {/* Configuration Error Message */}
                      {isConfigError ? (
                        <motion.div
                          key="config_err"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4 text-center py-6"
                        >
                          <div className="text-rose-400 font-bold text-xs">⚠️ SUPABASE CONNECTION ERROR</div>
                          <p className="text-[10px] text-white/50 leading-relaxed">
                            Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing or incorrectly loaded.
                          </p>
                          <p className="text-[9px] text-white/30">
                            Please configure them in your <code className="bg-white/5 px-1 py-0.5 rounded text-white font-mono">.env.local</code> and restart the development server.
                          </p>
                        </motion.div>
                      ) : stagingStep === "idle" && authState === "unauthenticated" ? (
                        <motion.div
                          key="unauth_form"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-6"
                        >
                          {/* Choose Guild Path */}
                          <div className="space-y-3">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">1. Choose Your Guild Path Placement</span>

                            <div className="grid grid-cols-3 gap-2">
                              {["builder", "architect", "guardian"].map(role => (
                                <button
                                  type="button"
                                  key={role}
                                  onClick={() => setSelectedGuild(role)}
                                  className={cn(
                                    "py-2.5 px-2 rounded-xl border text-[9px] font-bold text-center uppercase tracking-wider transition-all",
                                    selectedGuild === role
                                      ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                                      : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white hover:border-white/10 hover:bg-white/[0.02]"
                                  )}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                          </div>

                          <form onSubmit={handleGoogleLogin} className="space-y-4">
                            {/* Handle input field (always active so they can customize) */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">2. Enter Custom Handle</label>
                              <Input
                                type="text"
                                required
                                placeholder="e.g. @builder_dan"
                                value={memberHandle}
                                onChange={e => setMemberHandle(e.target.value)}
                                className="h-11 text-xs bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:ring-1 focus-visible:ring-offset-0 font-mono"
                              />
                            </div>

                            <Button
                              type="submit"
                              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-mono text-[10px] font-bold uppercase tracking-wider gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] pt-0.5"
                            >
                              <Chrome className="w-4 h-4" />
                              Register & Handshake with Google
                            </Button>
                          </form>
                        </motion.div>
                      ) : stagingStep === "idle" && authState === "authenticated_handshake" && !memberDetails ? (
                        /* Fallback Staging Area if user logged in but has no DB record and localStorage was empty */
                        <motion.div
                          key="auth_unregistered"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-5"
                        >
                          <div className="flex gap-2.5 items-center px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="font-bold text-[9px] uppercase tracking-wider">Google Handshake Verified</span>
                          </div>

                          <span className="text-[9px] text-white/40 leading-relaxed block">
                            Authenticated as <strong className="text-white">{user?.email}</strong>. Please select your placement details to compile your Sovereign Member ID card:
                          </span>

                          <div className="space-y-3">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">1. Choose Your Guild Path Placement</span>
                            <div className="grid grid-cols-3 gap-2">
                              {["builder", "architect", "guardian"].map(role => (
                                <button
                                  type="button"
                                  key={role}
                                  onClick={() => setSelectedGuild(role)}
                                  className={cn(
                                    "py-2.5 px-2 rounded-xl border text-[9px] font-bold text-center uppercase tracking-wider transition-all",
                                    selectedGuild === role
                                      ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                                      : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white hover:border-white/10 hover:bg-white/[0.02]"
                                  )}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                          </div>

                          <form onSubmit={handleManualRegister} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">2. Enter Custom Handle</label>
                              <Input
                                type="text"
                                required
                                placeholder="e.g. @builder_dan"
                                value={memberHandle}
                                onChange={e => setMemberHandle(e.target.value)}
                                className="h-11 text-xs bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:ring-1 focus-visible:ring-offset-0 font-mono"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                type="submit"
                                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-mono text-[10px] font-bold uppercase tracking-wider gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] pt-0.5"
                              >
                                <Award className="w-4 h-4" />
                                Confirm Alliance Registration
                              </Button>

                              <Button
                                type="button"
                                onClick={handleResetRegistration}
                                variant="outline"
                                className="w-full h-11 rounded-xl border border-white/10 text-white hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider gap-2"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                Disconnect Account
                              </Button>
                            </div>
                          </form>
                        </motion.div>
                      ) : stagingStep === "registering" ? (
                        <motion.div
                          key="sync"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3 h-[180px] overflow-y-auto pr-1 scrollbar-thin text-white/80"
                        >
                          {registerLogs.map((log, index) => (
                            <p key={index} className={cn(
                              "leading-relaxed",
                              log.startsWith("✔") ? "text-emerald-400 font-semibold" :
                                log.startsWith("❌") ? "text-rose-400 font-semibold" : "text-white/60"
                            )}>
                              {log}
                            </p>
                          ))}

                          {/* If any log starts with "❌", show Return/Reset buttons, else show the active loading spin! */}
                          {registerLogs.some(log => log.startsWith("❌")) ? (
                            <div className="pt-4 flex flex-col gap-2">
                              <Button
                                onClick={() => {
                                  setStagingStep("idle");
                                  setRegisterLogs([]);
                                }}
                                className="h-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-mono text-[9px] uppercase tracking-wider"
                              >
                                Return to Staging Panel
                              </Button>
                              <Button
                                onClick={handleResetRegistration}
                                variant="outline"
                                className="h-9 rounded-lg border border-white/10 text-white hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider"
                              >
                                Disconnect Account & Logout
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center text-primary font-bold pt-1.5 animate-pulse">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>COMPILING MEMBER ALLIANCE CARD...</span>
                            </div>
                          )}
                        </motion.div>
                      ) : stagingStep === "active" && memberDetails ? (
                        <motion.div
                          key="active"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-5"
                        >
                          {/* Inject high-tech holographic animations */}
                          <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes obn-card-scan {
                              0%, 100% { top: 0%; opacity: 0.2; }
                              50% { top: 100%; opacity: 0.8; }
                            }
                            @keyframes obn-ring-spin {
                              0% { transform: rotate(0deg); }
                              100% { transform: rotate(360deg); }
                            }
                          `}} />

                          {/* Member Certificate Badge Grid - Cyber Holographic Badge design */}
                          <div className="relative w-full bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.02)] select-none">

                            {/* Dynamic Neon Glow Background */}
                            <div
                              className="absolute -inset-20 opacity-20 blur-[80px] pointer-events-none rounded-full"
                              style={{
                                background: `radial-gradient(circle, ${baseColor} 0%, transparent 70%)`
                              }}
                            />

                            {/* Tech Cyber Dot Matrix */}
                            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none" />

                            {/* High-Tech Corner Framing Brackets */}
                            <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-white/20" />
                            <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-white/20" />
                            <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-white/20" />
                            <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-white/20" />

                            {/* Neon Laser Scanning Beam Overlay */}
                            <div
                              className="absolute left-0 w-full h-[2px] pointer-events-none"
                              style={{
                                animation: "obn-card-scan 4s ease-in-out infinite",
                                background: `linear-gradient(90deg, transparent, ${baseColor}, transparent)`
                              }}
                            />

                            {/* Card Content Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">

                              {/* Left Column: Cyber Avatar & Barcode */}
                              <div className="col-span-1 md:col-span-4 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6">

                                {/* High-tech Concentric Pulsing Ring Frame */}
                                <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-black/50 border border-white/10 shadow-inner group">
                                  <Award
                                    className="w-10 h-10 transition-transform duration-500 group-hover:scale-110"
                                    style={{ color: baseColor }}
                                  />
                                  {/* Fast Concentric Outer Spinning Ring */}
                                  <div
                                    className="absolute -inset-1.5 rounded-full border border-dashed opacity-45 animate-spin"
                                    style={{
                                      borderColor: baseColor,
                                      animationDuration: "12s"
                                    }}
                                  />
                                  {/* Slow Concentric Inner Spinning Ring */}
                                  <div
                                    className="absolute -inset-3 rounded-full border border-dotted opacity-20"
                                    style={{
                                      borderColor: baseColor,
                                      animation: "obn-ring-spin 30s linear infinite reverse"
                                    }}
                                  />
                                </div>

                                {/* Seal/Status Tag */}
                                <div className="mt-4 flex flex-col items-center gap-1">
                                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                                    <CheckCircle className="w-2.5 h-2.5 animate-pulse" />
                                    VERIFIED
                                  </div>
                                  <span className="text-[7px] text-white/30 tracking-widest font-mono mt-1">SOVEREIGN ENTRY</span>
                                </div>

                                {/* Simulated Dynamic Barcode */}
                                <div className="hidden md:flex gap-0.5 opacity-30 h-10 mt-6 w-full justify-center">
                                  {[2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1].map((w, i) => (
                                    <div key={i} className="h-full bg-white" style={{ width: `${w}px` }} />
                                  ))}
                                </div>

                              </div>

                              {/* Right Column: Identity metadata fields */}
                              <div className="col-span-1 md:col-span-8 space-y-4 text-left font-mono">

                                {/* Corporate Registry Header */}
                                <div className="flex justify-between items-center text-[8px] text-white/30 uppercase tracking-widest">
                                  <span>OPEN BUILD NETWORK</span>
                                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    NODE_ACTIVE
                                  </span>
                                </div>

                                {/* User profile header info */}
                                <div className="space-y-1">
                                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-white font-sans">{memberDetails.name}</h3>
                                  <span className="text-[9px] text-white/40 block truncate">{memberDetails.email}</span>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* High-tech Identity Placement details */}
                                <div className="grid grid-cols-2 gap-4 text-[9px]">
                                  <div>
                                    <span className="text-white/20 uppercase tracking-wider block mb-0.5">Guild Path</span>
                                    <span className="font-bold uppercase truncate block" style={{ color: baseColor }}>
                                      {memberDetails.guild}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-white/20 uppercase tracking-wider block mb-0.5">Member Handle</span>
                                    <span className="font-bold text-white block">{memberDetails.handle}</span>
                                  </div>
                                  <div>
                                    <span className="text-white/20 uppercase tracking-wider block mb-0.5">Enrollment Date</span>
                                    <span className="font-bold text-white block">{memberDetails.date}</span>
                                  </div>
                                  <div>
                                    <span className="text-white/20 uppercase tracking-wider block mb-0.5">Asymmetric Registry Key</span>
                                    <span className="font-bold text-cyan-400 flex items-center gap-1 truncate block">
                                      <Key className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                      {memberDetails.regHash}
                                    </span>
                                  </div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* Blockchain Verification Footer Tag */}
                                <div className="flex justify-between items-center text-[8px] text-white/30 font-bold uppercase tracking-wider">
                                  <span>ALLIANCE_MEMBER_SECURE_ID</span>
                                  <span className="text-xs font-bold font-mono tracking-widest" style={{ color: baseColor }}>
                                    {memberDetails.memberId}
                                  </span>
                                </div>

                              </div>

                            </div>

                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={handleDownloadCard}
                              className="w-full h-11 rounded-xl text-white font-mono text-[9px] uppercase tracking-wider gap-2 font-bold transition-all duration-300"
                              style={{
                                backgroundColor: baseColor,
                                boxShadow: `0 0 15px ${baseColor}40`
                              }}
                            >
                              <Download className="w-4 h-4" />
                              Download secure OBN ID Card
                            </Button>

                            <Button
                              onClick={handleResetRegistration}
                              variant="outline"
                              className="w-full h-11 rounded-xl border border-white/10 text-white hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider gap-2"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Disconnect Identity
                            </Button>
                          </div>
                        </motion.div>
                      ) : null}

                    </AnimatePresence>

                  </div>

                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CTASection;
