import useSound from 'use-sound';
import { useEffect } from 'react';

const PingComponent = ({ shouldPlaySound }) => {
  const [play] = useSound('./sounds/ping.mp3');

  useEffect(() => {
    if (shouldPlaySound) {
      play();
    }
  }, [shouldPlaySound, play]);

  // Component logic...
};

export default PingComponent