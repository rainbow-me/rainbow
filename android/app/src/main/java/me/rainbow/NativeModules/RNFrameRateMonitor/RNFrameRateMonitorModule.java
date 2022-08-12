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
  private RNFrameRateMonitorFrameDropStatsManager frameDropStatsManager;
  private boolean running = false;

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
    if (!running) {
      running = true;
      frameDropStatsManager = new RNFrameRateMonitorFrameDropStatsManager(reactContext);
      if (frameCallback == null) {
        frameCallback = new RNFrameRateMonitorFrameCallback(reactContext, frameDropStatsManager);
      } else {
        frameCallback.setFrameDropStatsManager(frameDropStatsManager);
      }
      frameCallback.start();
    }
  }

  @ReactMethod
  public void stopMonitoring() {
    if (running) {
      running = false;
      frameDropStatsManager.finish();
      frameCallback.stop();
    }
  }

  @ReactMethod
  public void getStats(Promise promise) {
    RNFrameRateMonitorFrameDropStats stats = frameDropStatsManager.getStats();
    promise.resolve(stats.toWritableMap());
  }
}
