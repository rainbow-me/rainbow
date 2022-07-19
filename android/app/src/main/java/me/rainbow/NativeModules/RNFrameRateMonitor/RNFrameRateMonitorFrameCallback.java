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
  private RNFrameRateMonitorStats stats;
  @Nullable
  private ChoreographerCompat choreographer;
  private final UIManagerModule uiManagerModule;
  private final DidJSUpdateUiDuringFrameDetector didJSUpdateUiDuringFrameDetector;

  private boolean shouldStop = true;

  public RNFrameRateMonitorFrameCallback(ReactContext reactContext) {
    this.reactContext = reactContext;
    uiManagerModule =
        Assertions.assertNotNull(reactContext.getNativeModule(UIManagerModule.class));
    stats = new RNFrameRateMonitorStats();
    didJSUpdateUiDuringFrameDetector = new DidJSUpdateUiDuringFrameDetector();
  }

  public void start() {
    shouldStop = false;
    Log.d("FRAMERARTE", "START");
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
    if (shouldStop) {
      // Stops posting new frame callbacks
      return;
    }

    // Executed on each Native frame
    Log.d("FRAME MONITOR", "do Frame fren");

    // schedules new frame callbacks for continuous calls post each frame
    if (choreographer != null) {
      choreographer.postFrameCallback(this);
    }
  }
}
