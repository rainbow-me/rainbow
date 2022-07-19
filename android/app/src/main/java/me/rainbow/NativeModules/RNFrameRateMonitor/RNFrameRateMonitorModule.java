package me.rainbow.NativeModules.RNFrameRateMonitor;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class RNFrameRateMonitorModule extends ReactContextBaseJavaModule {
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
    frameCallback = new RNFrameRateMonitorFrameCallback(reactContext);
    frameCallback.start();
  }

  @ReactMethod
  public void stopMonitoring() {
//    frameCallback.stop();
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
