import { Vibration } from 'react-native';

let isRinging = false;

export const SoundAlert = {
  play: async () => {
    if (isRinging) return;
    isRinging = true;

    // Continuous pulsing vibration (vibrate 600ms, pause 400ms, repeat)
    try {
      Vibration.vibrate([0, 600, 400, 600, 400], true);
    } catch (e) {
      console.warn('Vibration alert error:', e);
    }
  },

  stop: () => {
    isRinging = false;
    try {
      Vibration.cancel();
    } catch (e) {
      console.warn('Error stopping vibration:', e);
    }
  },
};
