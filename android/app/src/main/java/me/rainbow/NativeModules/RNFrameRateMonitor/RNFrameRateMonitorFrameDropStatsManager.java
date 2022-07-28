package me.rainbow.NativeModules.RNFrameRateMonitor;

import android.content.Context;
import android.util.Log;
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
    Log.d(TAG, "RATE: " + SCREEN_REFRESH_RATE);
    DEFAULT_FRAME_DURATION = 1000 / SCREEN_REFRESH_RATE;
    Log.d(TAG, "DURATION: " + DEFAULT_FRAME_DURATION);
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
    long sessionDuration = finishTimeMillis - startTimeMillis;
    Log.d(TAG, "sessionDuration: " + sessionDuration);
    Log.d(TAG, "finishTimeMillis: " + finishTimeMillis);
    Log.d(TAG, "startTimeMillis: " + startTimeMillis);
    int expectedFramesToBeDrawn = (int) (sessionDuration / DEFAULT_FRAME_DURATION);
    int totalFramesDropped = expectedFramesToBeDrawn - totalFramesDrawn;
    double framesDroppedRate = (double) totalFramesDropped / expectedFramesToBeDrawn * 100;
    double framesDrawnRate = (double) totalFramesDrawn / expectedFramesToBeDrawn * 100;


    return new RNFrameRateMonitorFrameDropStats(sessionDuration, SCREEN_REFRESH_RATE, expectedFramesToBeDrawn, totalFramesDropped, totalFramesDrawn, framesDroppedRate, framesDrawnRate);
  }
}
