"use client";

import React, { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── RUNTIME PROTOTYPE DEFENSE SHIELD ──────────────────────────────────────────
// Shields Three.js primitives from ambient development tools that inject data-* props
// (like data-reticle-source or data-testid) onto virtual JSX components, which R3F's
// applyProps reconciler otherwise splits into instance.data.reticle or instance.data.testid.
if (typeof window !== "undefined") {
  const applyShield = (proto: any) => {
    if (proto && !Object.prototype.hasOwnProperty.call(proto, "data")) {
      Object.defineProperty(proto, "data", {
        value: new Proxy({}, { get: () => () => {}, set: () => true }),
        writable: true,
        configurable: true,
      });
    }
  };
  applyShield(THREE.Object3D.prototype);
  applyShield(THREE.Material.prototype);
  applyShield(THREE.BufferGeometry.prototype);
}

/**
 * Hero3DScene — Internal Three.js algorithmic geometry assembly.
 * 
 * Features:
 * - Algorithmic delta-wing jet fuselage (Cone/Pyramid geometry)
 * - Concentric wireframe targeting radar rings & HUD reticles
 * - Dynamic pointer tracking via smooth lerp interpolation
 * - Dynamic scrollytelling: pitch/zoom updates linked directly to window.scrollY
 * - Empirical proof loop: increments window.__HERO_FRAME_COUNT when active
 */
interface SceneProps {
  isIntersecting: boolean;
}

function JetGeometry({ isIntersecting }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const radarRef = useRef<THREE.Group>(null!);
  const outerRingRef = useRef<THREE.Mesh>(null!);
  const { viewport } = useThree();

  // Pointer tracking targets
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!isIntersecting || !groupRef.current) return;

    // ── EMPIRICAL PROOF HOOK ────────────────────────────────────────────────
    // Increment global window frame counter for automated Playwright suspension proof
    if (typeof window !== "undefined") {
      const win = window as any;
      win.__HERO_FRAME_COUNT = (win.__HERO_FRAME_COUNT || 0) + 1;
    }

    // 1. Pointer Tracking Telemetry (smooth damping)
    const px = (state.pointer.x * viewport.width) / 4;
    const py = (state.pointer.y * viewport.height) / 4;

    targetRotation.current.y = px * 0.35;
    targetRotation.current.x = -py * 0.35;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, 0.08);
    
    // Gentle floating breathing animation
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;

    // 2. Continuous Radar Sweep Rotations
    if (radarRef.current) {
      radarRef.current.rotation.z -= delta * 0.5;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += delta * 0.3;
      outerRingRef.current.rotation.y -= delta * 0.4;
    }

    // 3. Scrollytelling Telemetry
    // As user scrolls down, tilt jet nose down and thrust slightly toward camera
    if (typeof window !== "undefined") {
      const scrollY = window.scrollY || 0;
      const progress = Math.min(1, Math.max(0, scrollY / 700));
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -progress * 0.4, 0.1);
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 6 - progress * 1.5, 0.1);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── CENTRAL DELTA JET FUSELAGE (Algorithmic 4-Sided Cone) ───────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
        <coneGeometry args={[0.8, 3.2, 4, 1]} />
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe Saffron Jet Frame Accent */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.205]}>
        <coneGeometry args={[0.82, 3.22, 4, 1]} />
        <meshBasicMaterial color="#F5A623" wireframe={true} />
      </mesh>

      {/* Afterburner Thruster Emissive Sphere */}
      <mesh position={[0, 0, -1.5]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#F5A623" />
      </mesh>

      {/* ── CONCENTRIC TARGETING HUD RADAR RINGS ───────────────────────────── */}
      <group ref={radarRef}>
        {/* Inner Target Reticle Torus */}
        <mesh>
          <torusGeometry args={[1.8, 0.02, 16, 64]} />
          <meshBasicMaterial color="#F5A623" opacity={0.65} transparent={true} />
        </mesh>
        {/* Secondary Dashed/Segmented Radar Torus */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[2.4, 0.015, 8, 32, Math.PI * 1.4]} />
          <meshBasicMaterial color="#D97706" opacity={0.45} transparent={true} />
        </mesh>
      </group>

      {/* Outer Gyroscopic Orbital Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[3.2, 0.01, 16, 64]} />
        <meshBasicMaterial color="#F5A623" opacity={0.3} transparent={true} wireframe={false} />
      </mesh>

      {/* Ambient Telemetry Waypoint Dots */}
      <points>
        <sphereGeometry args={[3.5, 8, 8]} />
        <pointsMaterial color="#F5A623" size={0.04} transparent opacity={0.5} />
      </points>
    </group>
  );
}

export default function Hero3DCanvas({ isIntersecting }: SceneProps) {
  return (
    <div
      data-testid="hero-3d-canvas"
      className="relative mx-auto w-full max-w-[340px] sm:max-w-[460px] h-[380px] sm:h-[440px] select-none overflow-hidden rounded-[2.5rem] border border-brand-accent-500/20 bg-brand-bg-canvas shadow-[0_0_60px_rgba(245,166,35,0.15)]"
    >
      {/* Ambient Radial Backdrop */}
      <div
        className="absolute -inset-10 pointer-events-none blur-3xl z-0"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(245,166,35,0.18), transparent 70%)" }}
        aria-hidden="true"
      />

      <Canvas
        frameloop={isIntersecting ? "always" : "never"}
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        className="relative z-10"
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#F5A623" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#38BDF8" />
        
        <JetGeometry isIntersecting={isIntersecting} />
      </Canvas>

      {/* Authoritative Capability Overlays */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 rounded-xl bg-brand-bg-elevated/90 border border-brand-border-subtle px-3 py-1.5 shadow-md">
        <span className="w-2 h-2 rounded-full bg-brand-accent-500 animate-pulse" />
        <div className="text-left">
          <p className="text-[9px] uppercase tracking-wider text-brand-ink-muted">AI Study Engine</p>
          <p className="font-mono text-[11px] font-bold text-brand-ink-inverse">Adaptive Syllabus Plan</p>
        </div>
      </div>

      <div className="absolute bottom-4 right-2 sm:right-4 z-20 pointer-events-none flex items-center gap-2 rounded-xl bg-brand-accent-500/15 border border-brand-accent-500/30 px-2.5 sm:px-3 py-1.5 shadow-md">
        <div className="text-left">
          <p className="text-[9px] uppercase tracking-wider text-brand-accent-500 font-semibold">Target Exams</p>
          <p className="font-mono text-[11px] font-bold text-brand-ink-inverse">AFCAT · CDS · NDA</p>
        </div>
      </div>
    </div>
  );
}
