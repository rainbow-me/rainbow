
package me.rainbow.NativeModules.Haptics;

import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

class RNHapticsPerformer {
  private final Vibrator mVibrator;
  private final boolean mHasAmplitudeControl;
  RNHapticsPerformer(Vibrator vibrator) {
    mVibrator = vibrator;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mHasAmplitudeControl = vibrator.hasAmplitudeControl();
    } else {
      mHasAmplitudeControl = false;
    }
    Log.d("SFDSSDF", String.valueOf(mHasAmplitudeControl));
  }

  void notificationSuccess() {
    if (mHasAmplitudeControl) {
      // check for the SDK version is done in the constructor
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{20, 65, 21}, new int[]{145, 0, 130}, -1));
    }
  }

  void notificationWarning() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{10, 200, 20}, new int[]{160, 0, 100 }, -1));
    }
  }

  void notificationError() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{10, 100, 10, 100, 20, 100, 20}, new int[]{160, 0, 160, 0, 140, 0, 80 }, -1));
    }

  }

  void impactHeavy() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{20, 10}, new int[]{0, 80}, -1));
    }
  }

  void impactLight() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{4}, new int[]{30}, -1));
    }
  }

  void selection() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(VibrationEffect.createWaveform(new long[]{2}, new int[]{60}, -1));
    }
  }
}
