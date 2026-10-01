const fs = require('fs');
const path = require('path');

// Generate 44100Hz 16-bit mono WAV with a crisp, bright, pleasant chime
function generateChimeWav() {
  const sampleRate = 44100;
  const duration = 0.55; // 550ms
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Synthesize a dual-tone marimba chime (G5 ~784Hz -> C6 ~1046.5Hz) with harmonics
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    let sample = 0;

    // Note 1: 783.99 Hz (starts at t=0, decays by 250ms)
    if (t < 0.3) {
      const env1 = Math.exp(-t * 18);
      const f1 = 783.99;
      sample += 0.45 * Math.sin(2 * Math.PI * f1 * t) * env1;
      sample += 0.20 * Math.sin(2 * Math.PI * (f1 * 2) * t) * env1; // 2nd harmonic
    }

    // Note 2: 1046.5 Hz (starts at t=0.08s, rings out with pleasant bell resonance)
    if (t >= 0.08) {
      const t2 = t - 0.08;
      const env2 = Math.exp(-t2 * 8.5);
      const f2 = 1046.5;
      sample += 0.70 * Math.sin(2 * Math.PI * f2 * t2) * env2;
      sample += 0.28 * Math.sin(2 * Math.PI * (f2 * 2) * t2) * env2; // Bell shimmer
      sample += 0.14 * Math.sin(2 * Math.PI * (f2 * 3) * t2) * env2; // Sparkle overtone
    }

    // Gentle global fade-in in first 2ms to prevent any click/pop
    if (t < 0.002) {
      sample *= (t / 0.002);
    }

    // Clamp between -0.98 and 0.98
    sample = Math.max(-0.98, Math.min(0.98, sample));

    // Convert to 16-bit PCM integer
    const intVal = Math.floor(sample * 32767);
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  return buffer;
}

const wavBuffer = generateChimeWav();

// Ensure public directory
const publicPath = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });
fs.writeFileSync(path.join(publicPath, 'beep.wav'), wavBuffer);
console.log('Saved to public/beep.wav');

// Ensure android/app/src/main/res/raw directory
const androidRawPath = path.resolve(__dirname, '../android/app/src/main/res/raw');
if (!fs.existsSync(androidRawPath)) fs.mkdirSync(androidRawPath, { recursive: true });
fs.writeFileSync(path.join(androidRawPath, 'beep.wav'), wavBuffer);
console.log('Saved to android/app/src/main/res/raw/beep.wav');
