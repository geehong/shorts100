import NewRankingUI from "@/components/test/NewRankingUI";

export default function TestPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #010a12 0%, #051820 40%, #0a2a1e 70%, #010a12 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background glow orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "15%", left: "50%",
          transform: "translateX(-50%)",
          width: 800, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)",
          filter: "blur(80px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "-15%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 60%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", top: "5%", left: "-10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(5,150,105,0.07) 0%, transparent 60%)",
          filter: "blur(70px)",
        }} />
      </div>

      {/* Phone mockup */}
      <div style={{
        position: "relative",
        zIndex: 1,
        /* outer shell */
        width: 399,
        flexShrink: 0,
        borderRadius: 54,
        background: "linear-gradient(160deg, #1c2e3d 0%, #0d1e2a 60%, #0a1820 100%)",
        padding: 12,
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.06),
          0 50px 120px rgba(0,0,0,0.85),
          0 0 100px rgba(45,212,191,0.05),
          inset 0 1px 0 rgba(255,255,255,0.07)
        `,
      }}>

        {/* Side buttons */}
        <div style={{
          position: "absolute", right: -4, top: 130,
          width: 4, height: 64, background: "#162430",
          borderRadius: "0 4px 4px 0",
          boxShadow: "inset -1px 0 0 rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", left: -4, top: 108,
          width: 4, height: 44, background: "#162430",
          borderRadius: "4px 0 0 4px",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", left: -4, top: 164,
          width: 4, height: 44, background: "#162430",
          borderRadius: "4px 0 0 4px",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.04)",
        }} />

        {/* Screen */}
        <div style={{
          width: "100%",
          height: "min(780px, calc(100svh - 100px))",
          borderRadius: 44,
          overflow: "hidden",
          background: "#030712",
          position: "relative",
        }}>
          {/* Notch */}
          <div style={{
            position: "absolute", top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: 110, height: 30,
            background: "#0d1e2a",
            borderRadius: "0 0 20px 20px",
            zIndex: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}>
            {/* Camera dot */}
            <div style={{
              position: "absolute", right: 22, top: "50%",
              transform: "translateY(-50%)",
              width: 8, height: 8, borderRadius: "50%",
              background: "#0a1520",
              boxShadow: "inset 0 0 0 1.5px rgba(45,212,191,0.15)",
            }} />
          </div>

          {/* Scrollable content */}
          <div style={{
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
          }}>
            <NewRankingUI contained />
          </div>
        </div>
      </div>

      {/* Footer label */}
      <p style={{
        position: "relative", zIndex: 1,
        marginTop: 28,
        color: "rgba(45,212,191,0.25)",
        fontSize: 11, fontWeight: 700,
        letterSpacing: "0.15em", textTransform: "uppercase",
        fontFamily: "monospace",
      }}>
        Shorts100 · UI Preview
      </p>
    </div>
  );
}
