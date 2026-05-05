import { css, type Handle, clientEntry, on } from 'remix/ui'

export type Mode = 'normal' | 'rapid' | 'green'

export type Program = {
  id: string
  label: string
  durations: Record<Mode, number>
}

export type TimerFormProps = {
  programs: Program[]
  delaySlots: number[]
}

const MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"

function slotLabel(min: number): string {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h}h`
  return `${h}:${String(m).padStart(2, '0')}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function fmtClock(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseEndTime(value: string, now: Date): Date {
  const [h, m] = value.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1)
  return d
}

function seedEndTime(runMin: number, smallestSlot: number): string {
  const seedNow = new Date()
  seedNow.setSeconds(0, 0)
  seedNow.setMinutes(seedNow.getMinutes() + 1)
  const end = new Date(seedNow.getTime() + (runMin + smallestSlot) * 60_000)
  return `${pad(end.getHours())}:${pad(end.getMinutes())}`
}

interface Result {
  delay: string
  info: string
}

function compute(program: Program, mode: Mode, endValue: string, slots: number[]): Result {
  const runMin = program.durations[mode]
  if (!endValue) return { delay: '—', info: 'pick an end time' }

  const now = new Date()
  const end = parseEndTime(endValue, now)
  const totalGapMin = Math.floor((end.getTime() - now.getTime()) / 60_000)
  const gapMin = totalGapMin - runMin

  if (gapMin < 0) {
    const earliest = new Date(now.getTime() + runMin * 60_000)
    return {
      delay: 'Too late',
      info: `earliest finish ${fmtClock(earliest)} · run ${slotLabel(runMin)}`,
    }
  }

  const smallest = slots[0]
  if (gapMin < smallest) {
    const finish = new Date(now.getTime() + runMin * 60_000)
    return {
      delay: 'Start now',
      info: `finish ~${fmtClock(finish)} · run ${slotLabel(runMin)}`,
    }
  }

  let chosen = slots[0]
  for (const s of slots) {
    if (s <= gapMin) chosen = s
    else break
  }

  const finish = new Date(now.getTime() + (chosen + runMin) * 60_000)
  return {
    delay: slotLabel(chosen),
    info: `finish ~${fmtClock(finish)} · target ${fmtClock(end)} · run ${slotLabel(runMin)}`,
  }
}

export const TimerForm = clientEntry(
  import.meta.url,
  function TimerForm(handle: Handle<TimerFormProps>) {
    const { programs, delaySlots } = handle.props

    let programId: string = programs[0].id
    let mode: Mode = 'normal'
    let endTime: string = seedEndTime(programs[0].durations.normal, delaySlots[0])

    const tick = setInterval(() => {
      if (handle.signal.aborted) {
        clearInterval(tick)
        return
      }
      handle.update()
    }, 60_000)

    const onProgram = (event: Event) => {
      programId = (event.currentTarget as HTMLSelectElement).value
      handle.update()
    }
    const onMode = (event: Event) => {
      mode = (event.currentTarget as HTMLInputElement).value as Mode
      handle.update()
    }
    const onTime = (event: Event) => {
      endTime = (event.currentTarget as HTMLInputElement).value
      handle.update()
    }

    return () => {
      const program = programs.find((p) => p.id === programId) ?? programs[0]
      const result = compute(program, mode, endTime, delaySlots)

      return (
        <div mix={css({ display: 'flex', flexDirection: 'column', gap: '32px' })}>
          <Field label="Program">
            <select
              mix={[
                on<HTMLSelectElement>('change', onProgram),
                css({
                  ...INPUT_BASE,
                  appearance: 'none',
                  backgroundImage:
                    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22 fill=%22none%22><path d=%22M1 1l4 4 4-4%22 stroke=%22currentColor%22 stroke-width=%221.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                }),
              ]}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id} selected={p.id === programId}>
                  {p.label} · {slotLabel(p.durations[mode])}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mode">
            <div
              mix={css({
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                overflow: 'hidden',
              })}
            >
              {(['normal', 'rapid', 'green'] as Mode[]).map((m) => (
                <ModeOption
                  key={m}
                  value={m}
                  label={m[0].toUpperCase() + m.slice(1)}
                  duration={slotLabel(program.durations[m])}
                  checked={mode === m}
                  onChange={onMode}
                />
              ))}
            </div>
          </Field>

          <Field label="Finish by">
            <input
              type="time"
              value={endTime}
              mix={[
                on<HTMLInputElement>('input', onTime),
                on<HTMLInputElement>('change', onTime),
                css(INPUT_BASE),
              ]}
            />
          </Field>

          <div mix={css(RESULT_BOX)}>
            <span mix={css(EYEBROW)}>Set delay to</span>
            <span
              mix={css({
                fontSize: '44px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                fontFamily: MONO,
              })}
            >
              {result.delay}
            </span>
            <span mix={css({ fontSize: '13px', color: 'var(--muted)', fontFamily: MONO })}>
              {result.info}
            </span>
          </div>
        </div>
      )
    }
  },
)

interface ModeOptionProps {
  value: Mode
  label: string
  duration: string
  checked: boolean
  onChange: (event: Event) => void
}

function ModeOption() {
  return ({ value, label, duration, checked, onChange }: ModeOptionProps) => (
    <label
      mix={css({
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '10px 12px',
        cursor: 'pointer',
        fontSize: '13px',
        color: 'var(--muted)',
        background: 'var(--bg)',
        transition: 'background-color 150ms ease, color 150ms ease',
        borderLeft: '1px solid var(--border)',
        '&:first-child': { borderLeft: 'none' },
        '&:hover': { background: 'var(--surface)', color: 'var(--fg)' },
        '&:has(input:checked)': { background: 'var(--accent-bg)', color: 'var(--accent-fg)' },
        '&:has(input:checked) .mode-time': { color: 'var(--accent-fg)', opacity: 0.6 },
        '& input': { position: 'absolute', opacity: 0, pointerEvents: 'none' },
      })}
    >
      <input
        type="radio"
        name="mode"
        value={value}
        checked={checked}
        mix={on<HTMLInputElement>('change', onChange)}
      />
      <span>{label}</span>
      <span
        class="mode-time"
        mix={css({
          fontFamily: MONO,
          fontSize: '10px',
          letterSpacing: '0.04em',
          color: 'var(--subtle)',
          transition: 'color 150ms ease, opacity 150ms ease',
        })}
      >
        {duration}
      </span>
    </label>
  )
}

interface FieldProps {
  label: string
  children?: any
}

function Field() {
  return ({ label, children }: FieldProps) => (
    <label mix={css({ display: 'flex', flexDirection: 'column', gap: '8px' })}>
      <span mix={css(EYEBROW)}>{label}</span>
      {children}
    </label>
  )
}

const INPUT_BASE = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  fontFamily: MONO,
  color: 'var(--fg)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  outline: 'none',
  transition: 'border-color 150ms ease, background-color 150ms ease',
  '&:hover': { borderColor: 'var(--border-strong)' },
  '&:focus': { borderColor: 'var(--fg)' },
} as const

const EYEBROW = {
  fontFamily: MONO,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--muted)',
} as const

const RESULT_BOX = {
  padding: '24px',
  borderRadius: '8px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  minHeight: '128px',
  transition: 'border-color 150ms ease',
  '&:hover': { borderColor: 'var(--border-strong)' },
} as const
