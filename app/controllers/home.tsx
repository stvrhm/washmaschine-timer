import type { BuildAction } from "remix/fetch-router";
import { css } from "remix/ui";

import { type Program, TimerForm } from "../assets/timer-form.tsx";
import type { routes } from "../routes.ts";
import { Document } from "../ui/document.tsx";
import { render } from "../utils/render.tsx";

export const home: BuildAction<"GET", typeof routes.home> = {
  handler({ request }) {
    return render(<TimerPage />, request);
  },
};

const PROGRAMS: Program[] = [
  {
    id: "mix",
    label: "Mix 30°",
    durations: { normal: 115, rapid: 60, green: 130 },
  },
  {
    id: "white",
    label: "White 30°",
    durations: { normal: 105, rapid: 60, green: 120 },
  },
];

// 10m, 30m, then 1h–24h every 30m
const DELAY_SLOTS_MIN: number[] = [
  10,
  30,
  ...Array.from({ length: 47 }, (_, i) => 60 + i * 30),
];

const FONT_STACK =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Inter', sans-serif";
const MONO_STACK =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

function TimerPage() {
  return () => (
    <Document title="Washing Machine Timer">
      <div mix={css(PAGE_STYLES)}>
        <main
          mix={css({
            width: "100%",
            maxWidth: "440px",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          })}
        >
          <header
            mix={css({
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              paddingBottom: "20px",
              borderBottom: "1px solid var(--border)",
            })}
          >
            <span
              mix={css({
                fontFamily: MONO_STACK,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--subtle)",
              })}
            >
              wash · timer
            </span>
            <h1
              mix={css({
                margin: 0,
                fontSize: "22px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              })}
            >
              Start-delay calculator
            </h1>
          </header>

          <TimerForm programs={PROGRAMS} delaySlots={DELAY_SLOTS_MIN} />

          <footer
            mix={css({
              fontFamily: MONO_STACK,
              fontSize: "11px",
              color: "var(--subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
            })}
          >
            rounds down · finishes before target
          </footer>
        </main>
      </div>
    </Document>
  );
}

const PAGE_STYLES = {
  "--bg": "#ffffff",
  "--fg": "#000000",
  "--muted": "#666666",
  "--subtle": "#a3a3a3",
  "--border": "#eaeaea",
  "--border-strong": "#d4d4d4",
  "--surface": "#fafafa",
  "--accent-bg": "#000000",
  "--accent-fg": "#ffffff",
  "@media (prefers-color-scheme: dark)": {
    "--bg": "#000000",
    "--fg": "#ededed",
    "--muted": "#a1a1a1",
    "--subtle": "#666666",
    "--border": "#1f1f1f",
    "--border-strong": "#2e2e2e",
    "--surface": "#0a0a0a",
    "--accent-bg": "#ededed",
    "--accent-fg": "#000000",
  },
  "& *, & *::before, & *::after": { boxSizing: "border-box" },
  minHeight: "100vh",
  background: "var(--bg)",
  color: "var(--fg)",
  fontFamily: FONT_STACK,
  fontSize: "14px",
  lineHeight: 1.5,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  display: "flex",
  justifyContent: "center",
  padding: "64px 24px",
} as const;
