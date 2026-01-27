import { useCallback, useRef } from "react";

// Phone dial tone frequencies (European standard)
const DIAL_TONE_FREQ = 425; // Hz
const RING_DURATION = 1000; // ms
const RING_PAUSE = 2000; // ms

export const useDialTone = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const shouldStopRef = useRef(false);

  // Returns true if it finished all rings; false if stopped early.
  const playRingTone = useCallback(async (ringCount?: number): Promise<boolean> => {
    // Random ring count: 2, 3, or 5
    const rings = ringCount ?? [2, 3, 5][Math.floor(Math.random() * 3)];
    
    // Create audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    isPlayingRef.current = true;
    shouldStopRef.current = false;

    for (let i = 0; i < rings; i++) {
      if (shouldStopRef.current) break;
      
      // Create oscillator for ring tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = DIAL_TONE_FREQ;
      oscillator.type = "sine";
      
      // Fade in/out for smoother sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + RING_DURATION / 1000 - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + RING_DURATION / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + RING_DURATION / 1000);
      
      // Wait for ring + pause
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, RING_DURATION + (i < rings - 1 ? RING_PAUSE : 0));
      });
    }
    
    isPlayingRef.current = false;
    return !shouldStopRef.current;
  }, []);

  const stopRingTone = useCallback(() => {
    shouldStopRef.current = true;
    isPlayingRef.current = false;
  }, []);

  const isPlaying = useCallback(() => isPlayingRef.current, []);

  return { playRingTone, stopRingTone, isPlaying };
};
