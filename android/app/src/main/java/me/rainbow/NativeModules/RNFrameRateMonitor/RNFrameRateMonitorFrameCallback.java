package me.rainbow.NativeModules.RNFrameRateMonitor;

import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.debug.DidJSUpdateUiDuringFrameDetector;
import com.facebook.react.uimanager.UIManagerModule;

public class RNFrameRateMonitorFrameCallback extends ChoreographerCompat.FrameCallback {
  private final ReactContext reactContext;
  @Nullable
  private ChoreographerCompat choreographer;
  private final UIManagerModule uiManagerModule;
  private final DidJSUpdateUiDuringFrameDetector didJSUpdateUiDuringFrameDetector;

  private RNFrameRateMonitorFrameDropStatsManager frameDropStatsManager;

  public void setFrameDropStatsManager(RNFrameRateMonitorFrameDropStatsManager frameDropStatsManager) {
    this.frameDropStatsManager = frameDropStatsManager;
  }

  private long lastFrameTime = -1;
  private boolean shouldStop = true;

  public RNFrameRateMonitorFrameCallback(ReactContext reactContext, RNFrameRateMonitorFrameDropStatsManager frameDropStatsManager) {
    this.reactContext = reactContext;
    this.frameDropStatsManager = frameDropStatsManager;
    uiManagerModule =
        Assertions.assertNotNull(reactContext.getNativeModule(UIManagerModule.class));
    didJSUpdateUiDuringFrameDetector = new DidJSUpdateUiDuringFrameDetector();
  }

  public void start() {
    reactContext
        .getCatalystInstance()
        .addBridgeIdleDebugListener(didJSUpdateUiDuringFrameDetector);
    uiManagerModule.setViewHierarchyUpdateDebugListener(didJSUpdateUiDuringFrameDetector);
    final RNFrameRateMonitorFrameCallback frameRateMonitorCallback = this;
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            choreographer = ChoreographerCompat.getInstance();
            choreographer.postFrameCallback(frameRateMonitorCallback);
          }
        });
  }

  public void stop() {
    shouldStop = true;
    reactContext
        .getCatalystInstance()
        .removeBridgeIdleDebugListener(didJSUpdateUiDuringFrameDetector);
    uiManagerModule.setViewHierarchyUpdateDebugListener(null);
  }

  @Override
  public void doFrame(long frameTimeNanos) {
    // Prevents next callbacks from being scheduled and cleans up after itself
    if (shouldStop) {
      shouldStop = false;
      return;
    }
    if (!frameDropStatsManager.isStarted()) {
      frameDropStatsManager.start();
    }
    long lastFrameStartTime = lastFrameTime;
    lastFrameTime = frameTimeNanos;
    if (didJSUpdateUiDuringFrameDetector.getDidJSHitFrameAndCleanup(lastFrameStartTime, frameTimeNanos)) {
      frameDropStatsManager.recordFrameDrawn();
    }
    // schedules new frame callbacks for continuous calls post each frame
    if (choreographer != null) {
      choreographer.postFrameCallback(this);
    }
  }
}
