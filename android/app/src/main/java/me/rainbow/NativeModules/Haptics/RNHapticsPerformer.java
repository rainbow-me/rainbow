
package me.rainbow.NativeModules.Haptics;

import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

class RNHapticsPerformer {
  private final Vibrator mVibrator;
  RNHapticsPerformer(Vibrator vibrator) {
    mVibrator = vibrator;
  }

  void notificationSuccess() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{20, 65, 21}, new int[]{145, 0, 130}, -1));
    }
  }

  void notificationWarning() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{10, 200, 20}, new int[]{160, 0, 100 }, -1));
    }
  }

  void notificationError() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{10, 100, 10, 100, 20, 100, 20}, new int[]{160, 0, 160, 0, 140, 0, 80 }, -1));
    }

  }

  void impactHeavy() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{20, 10}, new int[]{0, 80}, -1));
    }
  }

  void impactLight() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{4}, new int[]{30}, -1));
    }
  }

  void selection() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{2}, new int[]{60}, -1));
    }
  }
}
