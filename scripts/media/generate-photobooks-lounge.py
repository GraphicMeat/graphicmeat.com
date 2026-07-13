#!/usr/bin/env python3
"""Render a 30-second acoustic lounge cue from installed, royalty-free Apple samples."""

from __future__ import annotations

import subprocess
import wave
from pathlib import Path

import numpy as np


SR = 48_000
DURATION = 30.0
FRAMES = int(SR * DURATION)
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "media" / "photobooks" / "audio" / "lounge-natural.wav"

VIBES = Path("/Library/Audio/Apple Loops/Apple/Apple Loops for GarageBand/Lounge Vibes 06.caf")
BASS = Path("/Library/Application Support/GarageBand/Instrument Library/Sampler/Sampler Files/Upright Jazz Bass/YTKBLONS1G1X03")
SHAKER = Path("/Library/Application Support/Logic/Ultrabeat Samples/Drum Machine Designer/Silverlake GB/Shaker_Silverlake_GB.aif")

rng = np.random.default_rng(7319)


def decode(path: Path, channels: int, filters: str | None = None) -> np.ndarray:
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path)]
    if filters:
        command += ["-af", filters]
    command += ["-f", "f32le", "-acodec", "pcm_f32le", "-ar", str(SR), "-ac", str(channels), "-"]
    raw = subprocess.check_output(command)
    audio = np.frombuffer(raw, dtype="<f4")
    return audio.reshape(-1, channels)


def fade_edges(audio: np.ndarray, fade_seconds: float) -> np.ndarray:
    result = audio.copy()
    n = min(int(fade_seconds * SR), len(result) // 2)
    curve = np.sin(np.linspace(0, np.pi / 2, n)) ** 2
    result[:n] *= curve[:, None]
    result[-n:] *= curve[::-1, None]
    return result


def shifted_note(sample: np.ndarray, semitones: float, seconds: float) -> np.ndarray:
    ratio = 2 ** (semitones / 12)
    wanted = int(seconds * SR)
    positions = np.arange(wanted) * ratio
    positions = np.clip(positions, 0, len(sample) - 1.001)
    left = positions.astype(np.int64)
    frac = positions - left
    note = sample[left] * (1 - frac) + sample[left + 1] * frac
    attack = min(int(0.012 * SR), wanted)
    release = min(int(0.10 * SR), wanted)
    note[:attack] *= np.linspace(0, 1, attack)
    note[-release:] *= np.linspace(1, 0, release)
    return note


mix = np.zeros((FRAMES, 2), dtype=np.float64)

# A real vibraphone performance. It is gently sped from 90 to 92 BPM and tiled
# with short equal-power crossfades so the joins remain musical.
vibes = decode(VIBES, 2, "atempo=1.0222222222")
vibes = fade_edges(vibes, 0.035)
cursor = 0
overlap = int(0.07 * SR)
while cursor < FRAMES:
    end = min(cursor + len(vibes), FRAMES)
    take = end - cursor
    segment = vibes[:take].astype(np.float64)
    if cursor and take > overlap:
        curve = np.sin(np.linspace(0, np.pi / 2, overlap)) ** 2
        mix[cursor : cursor + overlap] *= (1 - curve)[:, None]
        segment[:overlap] *= curve[:, None]
    mix[cursor:end] += segment * 0.62
    cursor += len(vibes) - overlap

# Recorded upright bass, played as a simple C6/9–Am7–Fmaj7–G13 cycle.
bass_sample = decode(BASS, 1)[:, 0].astype(np.float64)
beat = 60 / 92
bar = beat * 4
root_offsets = [5, 2, -2, 0]  # relative to the recorded G1 sample
walks = [[5, 9, 12, 9], [2, 5, 9, 5], [-2, 2, 5, 2], [0, 4, 7, 4]]
bar_index = 0
while bar_index * bar < DURATION:
    start = bar_index * bar
    pattern = walks[bar_index % 4]
    for beat_index, semitones in enumerate(pattern):
        jitter = rng.uniform(-0.014, 0.014)
        note_audio = shifted_note(bass_sample, semitones, 0.52 if beat_index else 0.68)
        gain = rng.uniform(0.18, 0.225) * (1.05 if beat_index == 0 else 1)
        position = max(0, int((start + beat_index * beat + jitter) * SR))
        end = min(position + len(note_audio), FRAMES)
        mix[position:end, 0] += note_audio[: end - position] * gain * 0.97
        mix[position:end, 1] += note_audio[: end - position] * gain
    bar_index += 1

# One recorded shaker hit, humanized rather than synthesized or grid-perfect.
shaker = decode(SHAKER, 1)[:, 0].astype(np.float64)
shaker = shaker[: min(len(shaker), int(0.24 * SR))]
if len(shaker) > int(0.04 * SR):
    shaker[-int(0.04 * SR) :] *= np.linspace(1, 0, int(0.04 * SR))
eighth = beat / 2
index = 2
while index * eighth < DURATION - 0.5:
    time = index * eighth + (0.022 if index % 2 else 0) + rng.uniform(-0.009, 0.009)
    position = int(time * SR)
    gain = rng.uniform(0.025, 0.043) * (1.15 if index % 4 == 2 else 1)
    end = min(position + len(shaker), FRAMES)
    pan = rng.uniform(-0.22, 0.22)
    mix[position:end, 0] += shaker[: end - position] * gain * (1 - pan)
    mix[position:end, 1] += shaker[: end - position] * gain * (1 + pan)
    index += 1

# Small room reflections and a calm entrance/exit.
dry = mix.copy()
for delay, gain in [(0.031, 0.10), (0.047, 0.07), (0.083, 0.045)]:
    samples = int(delay * SR)
    mix[samples:, 0] += dry[:-samples, 1] * gain
    mix[samples:, 1] += dry[:-samples, 0] * gain

fade_in = int(0.55 * SR)
fade_out = int(1.15 * SR)
mix[:fade_in] *= (np.sin(np.linspace(0, np.pi / 2, fade_in)) ** 2)[:, None]
mix[-fade_out:] *= (np.cos(np.linspace(0, np.pi / 2, fade_out)) ** 2)[:, None]

mix = np.tanh(mix * 1.08)
peak = np.max(np.abs(mix))
mix *= (10 ** (-1.4 / 20)) / peak
pcm = np.int16(np.clip(mix, -1, 1) * 32767)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(SR)
    output.writeframes(pcm.tobytes())

print(OUT)
