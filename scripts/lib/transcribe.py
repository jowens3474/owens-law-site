#!/usr/bin/env python3
"""Transcribe an audio file with faster-whisper on CPU and print JSON cues.

Usage: transcribe.py <audio> [model]
Output: [{"t": <seconds>, "text": "..."}, ...]
"""
import json
import sys

from faster_whisper import WhisperModel

path = sys.argv[1]
model_name = sys.argv[2] if len(sys.argv) > 2 else "small.en"

model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, info = model.transcribe(path, language="en", beam_size=1, vad_filter=True, condition_on_previous_text=False)
cues = []
for seg in segments:
    text = seg.text.strip()
    if text:
        cues.append({"t": int(seg.start), "text": text})
    if len(cues) % 200 == 0 and cues:
        print(f"[whisper] {int(seg.start) // 60} min", file=sys.stderr)
print(json.dumps(cues))
