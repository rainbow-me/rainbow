package me.rainbow.NativeModules.RNFrameRateMonitor;

import android.content.Intent;
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
      Log.d(TAG, "started monitoring frame rate");
      frameDropStatsManager = new RNFrameRateMonitorFrameDropStatsManager(reactContext);
      if (frameCallback == null) {
        frameCallback = new RNFrameRateMonitorFrameCallback(reactContext, frameDropStatsManager);
      } else {
        frameCallback.setFrameDropStatsManager(frameDropStatsManager);
      }
      frameCallback.start();
    } else {
      Log.d(TAG, "Monitoring running already, cannot start twice.");
    }
  }

  @ReactMethod
  public void stopMonitoring() {
    Log.d(TAG, "STOPPING MONITORING");
    if (running) {
      running = false;
      frameDropStatsManager.finish();
      frameCallback.stop();
    } else {
      Log.d(TAG, "Monitoring isn't running cannot stop it.");
    }
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
