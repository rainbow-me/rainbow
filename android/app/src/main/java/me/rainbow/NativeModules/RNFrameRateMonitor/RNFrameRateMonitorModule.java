package me.rainbow.NativeModules.RNFrameRateMonitor;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.Map;

public class RNFrameRateMonitorModule extends ReactContextBaseJavaModule {
  private final String TAG = "FrameRateMonitorModule";
  private final ReactContext reactContext;
  private RNFrameRateMonitorFrameCallback frameCallback;
  private RNFrameRateMonitorFrameDropStatsManager frameDropStatsManager;

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
    frameDropStatsManager = new RNFrameRateMonitorFrameDropStatsManager(reactContext);
    if (frameCallback == null) {
      frameCallback = new RNFrameRateMonitorFrameCallback(reactContext, frameDropStatsManager);
    } else {
      frameCallback.setFrameDropStatsManager(frameDropStatsManager);
    }
    frameCallback.start();
  }

  @ReactMethod
  public void stopMonitoring() {
    Log.d(TAG, "stopped monitoring frame rate");
    frameDropStatsManager.finish();
    frameCallback.stop();
  }

  @ReactMethod
  public void getStats(Promise promise) {
    RNFrameRateMonitorFrameDropStats stats = frameDropStatsManager.getStats();
    promise.resolve(stats.toWritableMap());
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
