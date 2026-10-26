# Brain Stack

A calm evening routine timer for "brain stacking": a short sequence of offline
activities (breathing, journaling, a puzzle, coloring, reading) done every
evening to settle an overthinking mind and train focus. Built for ADHD brains:
visual timers, gentle transitions, no streak guilt.

It is a Progressive Web App (PWA): one codebase that installs on a computer
(Windows, macOS, Linux) and on Android, works offline, and needs no app store.

**Live app:** https://adrianna-hamsteroo.github.io/brain-stack/

## What it does

- **Three routines for three energy levels**: Full (~65 min), Everyday
  (~35 min) and Low battery (~12 min). They follow the research order, from
  mental effort to bodily calm: set the scene, journal, puzzle, coloring,
  reading, three good things, breathing. Every step, timing and prompt is
  editable. See [RESEARCH.md](RESEARCH.md) for why.
- **Visual timer** in the style of a Time Timer: a colored wedge that shrinks
  as time passes, one tick per minute, plus the clock time the step ends.
- **Open-ended journaling** that counts up and gives a gentle nudge at 10
  minutes, with concrete "what's my next step?" prompts and a "Park it"
  button, so writing doesn't tip into rumination.
- **Firm stop for puzzles** (no "+5 minutes"), because puzzles invite
  hyperfocus and brain work right before bed delays sleep. Any timed step can
  be switched to a firm stop.
- **Soft transitions**: a heads-up chime two minutes before longer steps end
  that names what's next, an "up next" screen, and "+5 minutes" without guilt.
- **Breathing guide** for cyclic sighing, and a **Quick calm** button with
  gentle slow breathing for anxious moments, plus a 5-4-3-2-1 grounding
  option for when breathing exercises make things worse.
- **Gentle on light**: warm dark theme, and the screen fades after 20 seconds
  without a touch during a step.
- **Check-in before and after** ("how busy is your mind?") so you can see the
  routine working over time.
- **Weekly goal instead of streaks**: 5 of 7 evenings by default, with rest
  nights built in. Progress shows as little cairns of stones, a five-week
  calendar and history. Missing a day never resets anything.
- **Why these timings?** page inside the app with the research and sources.
- Chimes are synthesized in the browser (no audio files). Everything stays on
  your device; backup/restore moves your data between phone and computer.

## Run it on your computer

You need Python 3 (already on macOS).

```bash
python3 tools/serve.py
```

Then open http://localhost:8765. Add `?speed=60` to the address to make every
minute last one second while you try things out.

## Install it

### On a computer

1. Open https://adrianna-hamsteroo.github.io/brain-stack/ in **Chrome** or **Edge**.
2. Click the install icon at the right of the address bar (or menu → "Install
   Brain Stack"). It gets its own window and a dock/taskbar icon.

On macOS with Safari 17+: **File → Add to Dock**.

### On an Android phone

1. Open https://adrianna-hamsteroo.github.io/brain-stack/ in **Chrome** on the phone.
2. Tap the menu (⋮) → **Install app** (on some phones: **Add to Home screen** →
   Install).

It opens full screen like a normal app and works offline after the first visit.

Want a real APK file instead? Paste the link into https://www.pwabuilder.com
and download the Android package.

### Updating the live app

The site is served by GitHub Pages from the `main` branch of
https://github.com/adrianna-hamsteroo/brain-stack. To publish a change, edit
the files, bump `VERSION` in `sw.js`, then commit and push. Pages redeploys in
about a minute, and installed copies pick up the update the second time
they're opened.

### Moving your routine between devices

Each device keeps its own data. In **Settings → Your data**, use **Save a
backup** on one device and **Restore a backup** on the other.

## Good to know

- **Keep the app open during a session.** Phones pause background web apps, so
  the chime only plays while Brain Stack is on screen. "Keep the screen on" is
  enabled by default for this; the timer itself stays correct even if you leave
  and come back.
- **Evening reminder**: web apps can't schedule notifications on their own, so
  Settings → Evening reminder creates a repeating calendar event instead.
- **Change the default routines** in `js/data.js` (`TEMPLATES` and `ROUTINES`).

## For developers

Plain HTML, CSS and JavaScript modules, no build step.

| File | What it holds |
|---|---|
| `js/data.js` | Activities, default routines, prompts, icons |
| `js/session.js` | The session runner: check-in, steps, transitions, summary |
| `js/timer.js` | Timestamp-based timer (survives throttling and restarts) |
| `js/breath.js` | Cyclic-sighing pacer |
| `js/views.js` | Tonight, Routine, Progress and Settings screens |
| `js/science.js` | "Why these timings?" content and sources |
| `sw.js` | Offline cache. Bump `VERSION` after changing any file |

The service worker is skipped on localhost so edits show up immediately; add
`?sw` to the address to test offline mode locally.

**Possible next steps**: wrap it with Capacitor for lock-screen alarms and real
notifications, or add optional sync between devices.

Brain Stack is a self-care tool, not treatment.
