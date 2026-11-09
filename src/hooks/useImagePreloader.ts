import { useEffect } from 'react';
import type { IconPlayer } from '../data/icons';
import { preloadImagesInBackground } from '../utils/imagePreloader';

export function useImagePreloader(icons: IconPlayer[]): void {
  useEffect(() => {
    let stopPreloading = preloadImagesInBackground(icons);
    const resume = () => {
      stopPreloading();
      stopPreloading = preloadImagesInBackground(icons);
    };
    window.addEventListener('online', resume);
    return () => {
      window.removeEventListener('online', resume);
      stopPreloading();
    };
  }, [icons]);
}
