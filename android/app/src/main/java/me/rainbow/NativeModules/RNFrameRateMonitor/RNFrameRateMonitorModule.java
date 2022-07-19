package me.rainbow.NativeModules.RNFrameRateMonitor;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class RNFrameRateMonitorModule extends ReactContextBaseJavaModule {
  private final String TAG = "FrameRateMonitorModule";
  private final ReactContext reactContext;
  private RNFrameRateMonitorFrameCallback frameCallback;

  public RNFrameRateMonitorModule(@Nullable ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @NonNull
  @Override
  public String getName() {
    return "RNFrameRateMonitorModule";
  }

  @ReactMethod
  public void startMonitoring() {
    Log.d(TAG, "started monitoring frame rate");
    if (frameCallback == null) {
      frameCallback = new RNFrameRateMonitorFrameCallback(reactContext);
    }
    frameCallback.start();
  }

  @ReactMethod
  public void stopMonitoring() {
    Log.d(TAG, "stopped monitoring frame rate");
    frameCallback.stop();
  }

  @ReactMethod
  public void getStats(Promise promise) {
  }

  @ReactMethod
  public void addSlowPeriodEventListener() {
  }

  @ReactMethod
  public void removeSlowPeriodEventListener() {
  }

  @ReactMethod
  public void resetStats() {
  }
}
