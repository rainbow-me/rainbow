package me.rainbow.NativeModules.RNFrameRateMonitor;

import android.content.Context;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactContext;

public class RNFrameRateMonitorFrameDropStatsManager {
  private final String TAG = "FrameDropStatsManager";
  private final float SCREEN_REFRESH_RATE;
  private final float DEFAULT_FRAME_DURATION;

  private long startTimeMillis = -1;
  private long finishTimeMillis = -1;
  private int totalFramesDrawn = -1;

  public RNFrameRateMonitorFrameDropStatsManager(ReactContext context) {
    WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    SCREEN_REFRESH_RATE = wm.getDefaultDisplay().getRefreshRate();
    DEFAULT_FRAME_DURATION = 1000 / SCREEN_REFRESH_RATE;
  }

  public boolean isStarted() {
    return startTimeMillis != -1;
  }

  public void start() {
    totalFramesDrawn = 0;
    startTimeMillis = System.currentTimeMillis();
  }

  public void recordFrameDrawn() {
    totalFramesDrawn += 1;
  }

  public void finish() {
    finishTimeMillis = System.currentTimeMillis();
  }

  public RNFrameRateMonitorFrameDropStats getStats() {
    int adjustedFramesDrawn = totalFramesDrawn - 1;
    long sessionDuration = finishTimeMillis - startTimeMillis;
    int expectedFramesToBeDrawn = (int) (sessionDuration / DEFAULT_FRAME_DURATION);
    int totalFramesDropped = expectedFramesToBeDrawn - adjustedFramesDrawn;
    double framesDroppedRate = (double) totalFramesDropped / expectedFramesToBeDrawn * 100;
    double framesDrawnRate = (double) adjustedFramesDrawn / expectedFramesToBeDrawn * 100;


    return new RNFrameRateMonitorFrameDropStats(sessionDuration, SCREEN_REFRESH_RATE, expectedFramesToBeDrawn, totalFramesDropped, adjustedFramesDrawn, framesDroppedRate, framesDrawnRate);
  }
}
