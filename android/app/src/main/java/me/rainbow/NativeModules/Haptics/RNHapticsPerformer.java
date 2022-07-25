
package me.rainbow.NativeModules.Haptics;

import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

class RNHapticsPerformer {
  // some phones (e.g., OnePlus 7) are lying about having the amplitude control
  // Then, we make every second tick 0 length with 0 ampl
  // so this is not impacting phones with amplitude control.
  // However, on those problematic phones, there are no vibrations at all

  static int [] addBreaks(int [] interval) {
    int [] results = new int[interval.length * 2];
    for (int i = 0; i < interval.length; i++) {
      results[i * 2] = interval[i];
      results[i * 2 + 1] = 0;
    }
    return results;
  }

  static long [] addBreaks(long [] interval) {
    long [] results = new long[interval.length * 2];
    for (int i = 0; i < interval.length; i++) {
      results[i * 2] = interval[i];
      results[i * 2 + 1] = 0;
    }
    return results;
  }

  private final Vibrator mVibrator;
  private final boolean mHasAmplitudeControl;
  RNHapticsPerformer(Vibrator vibrator) {
    mVibrator = vibrator;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mHasAmplitudeControl = vibrator.hasAmplitudeControl();
    } else {
      mHasAmplitudeControl = false;
    }
  }

  void notificationSuccess() {
    if (mHasAmplitudeControl) {
      // check for the SDK version is done in the constructor
      mVibrator.vibrate(
              VibrationEffect.createWaveform(
                      addBreaks(new long[]{20, 65, 21}),
                      addBreaks(new int[]{145, 0, 130}),
                      -1
              )
      );
    }
  }

  void notificationWarning() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(
              VibrationEffect.createWaveform(
                      addBreaks(new long[]{10, 200, 20}),
                      addBreaks(new int[]{160, 0, 100 }),
                      -1));
    }
  }

  void notificationError() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(
              VibrationEffect.createWaveform(
                      addBreaks(new long[]{10, 100, 10, 100, 20, 100, 20}),
                      addBreaks(new int[]{160, 0, 160, 0, 140, 0, 80 }),
                      -1));
    }

  }

  void impactHeavy() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(
              VibrationEffect.createWaveform(
                      addBreaks(new long[]{20, 10}),
                      addBreaks(new int[]{0, 80}),
                      -1));
    }
  }

  void impactLight() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(
              VibrationEffect.createWaveform(
                      addBreaks(new long[]{4}),
                      addBreaks(new int[]{30}),
                      -1));
    }
  }

  void selection() {
    if (mHasAmplitudeControl) {
      mVibrator.vibrate(
              VibrationEffect.createWaveform(
                      addBreaks(new long[]{2}),
                      addBreaks(new int[]{60}),
                      -1));
    }
  }
}
