
package me.rainbow.NativeModules.Haptics;

import android.content.Context;
import android.os.Vibrator;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class RNRainbowHapticsModule extends ReactContextBaseJavaModule {
  private final RNHapticsPerformer mPerformer;

  public RNRainbowHapticsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    Vibrator vibrator = (Vibrator) reactContext.getSystemService(Context.VIBRATOR_SERVICE);
    mPerformer = new RNHapticsPerformer(vibrator);
  }

  @Override
  public String getName() {
      return "RNRainbowHaptics";
  }

  @ReactMethod
  public void notification(String type) {
    switch (type) {
      case "error":
        mPerformer.notificationError();
        break;
      case "warning":
        mPerformer.notificationWarning();
        break;
      default:
        mPerformer.notificationSuccess();
        break;
    }
  }

  @ReactMethod
  public void selection() {
    mPerformer.selection();
  }

  @ReactMethod
  public void impact(String type) {
    switch (type) {
      case "light":
        mPerformer.impactLight();
        break;
      case "heavy":
        mPerformer.impactHeavy();
        break;
    }
  }
}
