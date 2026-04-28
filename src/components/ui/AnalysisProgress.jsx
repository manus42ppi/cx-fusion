import React, { useState, useEffect, useMemo } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../../constants/colors.js";
import { RefreshCw } from "lucide-react";

/**
 * Consistent animated progress bar shown during any analysis.
 *
 * Props:
 *   loading     – bool: show/hide
 *   steps       – string[]: messages to cycle through
 *   accent      – optional color override (default C.accent)
 *   label       – optional short label (default "Analysiere")
 */
export default function AnalysisProgress({
  loading = false,
  steps = [],
  accent = null,
  label = "Analysiere",
}) {
  const [stepIdx,  setStepIdx]  = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const [progress, setProgress] = useState(0);

  const color = accent || C.accent;

  const msgs = useMemo(() => steps.length > 0 ? steps : [
    "Verbinde mit Domain…",
    "Lade Daten…",
    "KI analysiert…",
    "Ergebnisse aufbereiten…",
  ], [steps]);

  useEffect(() => {
    if (!loading) {
      setStepIdx(0);
      setElapsed(0);
      setProgress(0);
      return;
    }

    // Elapsed timer
    const t0 = Date.now();
    const elapsedTimer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - t0) / 1000));
    }, 1000);

    // Step cycling
    const stepTimer = setInterval(() => {
      setStepIdx(i => (i + 1) % msgs.length);
    }, 2200);

    // Progress simulation (reaches ~85% then slows down)
    let prog = 0;
    const progressTimer = setInterval(() => {
      setProgress(p => {
        const remaining = 92 - p;
        const inc = Math.max(0.3, remaining * 0.06);
        return Math.min(92, p + inc);
      });
    }, 300);

    return () => {
      clearInterval(elapsedTimer);
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [loading]);

  if (!loading) return null;

  const currentStep = msgs[stepIdx] || msgs[0];

  return (
    <div style={{
      marginTop: 14,
      padding: "16px 18px",
      borderRadius: T.rMd,
      background: color + "08",
      border: `1px solid ${color}25`,
      fontFamily: FONT,
      animation: "fadeIn .25s ease",
    }}>
      {/* Top row: label + elapsed */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RefreshCw
            size={13}
            color={color}
            strokeWidth={IW}
            style={{ animation: "spin .9s linear infinite", flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: ".01em" }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: 11, color: C.textMute, fontVariantNumeric: "tabular-nums" }}>
          {elapsed}s
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 5, borderRadius: 99,
        background: color + "18",
        overflow: "hidden",
        marginBottom: 10,
      }}>
        <div style={{
          height: "100%",
          borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          width: `${progress}%`,
          transition: "width .35s ease",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Shimmer */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.4) 50%, transparent 100%)",
            animation: "shimmer 1.6s ease infinite",
          }} />
        </div>
      </div>

      {/* Step messages */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 11, color: C.textSoft,
          animation: "fadeIn .3s ease",
          key: currentStep,
        }}>
          {currentStep}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: color + "99",
          fontVariantNumeric: "tabular-nums",
        }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
        {msgs.map((msg, i) => (
          <div
            key={i}
            title={msg}
            style={{
              height: 4, borderRadius: 99,
              flex: 1, minWidth: 20,
              background: i <= stepIdx ? color : color + "20",
              transition: "background .4s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
