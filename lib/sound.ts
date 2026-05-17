let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function note(
  context: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.28,
  type: OscillatorType = "sine",
) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.connect(gain);
  gain.connect(context.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + duration * 0.5);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function playCorrect() {
  const context = getCtx();
  if (!context) return;
  const t = context.currentTime;
  note(context, 523.25, t, 0.13);        // C5
  note(context, 659.25, t + 0.11, 0.18); // E5
}

export function playWrong() {
  const context = getCtx();
  if (!context) return;
  const t = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.connect(gain);
  gain.connect(context.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(210, t);
  osc.frequency.exponentialRampToValueAtTime(105, t + 0.32);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.012);
  gain.gain.linearRampToValueAtTime(0, t + 0.34);
  osc.start(t);
  osc.stop(t + 0.4);
}

export function playGameOver() {
  const context = getCtx();
  if (!context) return;
  const t = context.currentTime;
  note(context, 261.63, t, 0.24);        // C4
  note(context, 220.00, t + 0.26, 0.24); // A3
  note(context, 174.61, t + 0.52, 0.38); // F3
}

export function playGameStart() {
  const context = getCtx();
  if (!context) return;
  const t = context.currentTime;
  note(context, 392.00, t, 0.1);         // G4
  note(context, 523.25, t + 0.1, 0.1);  // C5
  note(context, 659.25, t + 0.2, 0.2);  // E5
}

export function playRoomEnd() {
  const context = getCtx();
  if (!context) return;
  const t = context.currentTime;
  note(context, 523.25, t, 0.15);        // C5
  note(context, 659.25, t + 0.16, 0.15); // E5
  note(context, 783.99, t + 0.32, 0.15); // G5
  note(context, 1046.50, t + 0.48, 0.38); // C6
}
