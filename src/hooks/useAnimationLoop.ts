import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export function useAnimationLoop() {
  const { isPlaying, duration, setCurrentTime, setIsPlaying } = useStore();
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== 0) {
        const deltaTime = time - lastTimeRef.current;

        let newTime = useStore.getState().currentTime + deltaTime;

        if (newTime >= duration) {
          newTime = duration;
          setIsPlaying(false);
        } else {
          requestRef.current = requestAnimationFrame(animate);
        }

        setCurrentTime(newTime);
      } else {
        requestRef.current = requestAnimationFrame(animate);
      }

      lastTimeRef.current = time;
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = 0;
    }
    
    return () => cancelAnimationFrame(requestRef.current);
  }, [duration, isPlaying, setCurrentTime, setIsPlaying]);
}
