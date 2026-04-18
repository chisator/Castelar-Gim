const fs = require('fs');

// Simple WAV header for 1 second of 44100Hz mono
const sampleRate = 44100;
const duration = 0.5;
const numSamples = Math.floor(sampleRate * duration);
const bytesPerSample = 1; // 8-bit
const blockAlign = bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;
const fileSize = 36 + dataSize;

const buffer = Buffer.alloc(fileSize + 8);

// RIFF chunk
buffer.write('RIFF', 0);
buffer.writeUInt32LE(fileSize, 4);
buffer.write('WAVE', 8);

// fmt chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Chunk size
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // Mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(8, 34); // Bits per sample

// data chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Generate sine wave (A4 = 440Hz)
const freq = 880;
const volume = 50; // 0-127
for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = 128 + Math.sin(t * freq * 2 * Math.PI) * volume;
    buffer.writeUInt8(Math.floor(sample), 44 + i);
}

const base64 = buffer.toString('base64');
fs.writeFileSync('beep.txt', base64);
console.log('Done');
