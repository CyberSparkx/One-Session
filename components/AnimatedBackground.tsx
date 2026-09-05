"use client";

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      {/* Noise grain overlay — fixed pseudo-element equivalent */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Orb 1 — Indigo, top-left area */}
      <div
        className="orb-1 absolute"
        style={{
          top: "-10%",
          left: "-5%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 50%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Orb 2 — Teal, top-right */}
      <div
        className="orb-2 absolute"
        style={{
          top: "5%",
          right: "-8%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(15,118,110,0.15) 0%, rgba(15,118,110,0.05) 50%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Orb 3 — Emerald, center-bottom */}
      <div
        className="orb-3 absolute"
        style={{
          bottom: "15%",
          left: "40%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Orb 4 — deep indigo, far bottom-right */}
      <div
        className="orb-1 absolute"
        style={{
          bottom: "-5%",
          right: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
          animationDelay: "4s",
        }}
      />

      {/* Grid overlay — subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
