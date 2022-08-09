package me.rainbow.NativeModules.RNFrameRateMonitor;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.gson.Gson;

public class RNFrameRateMonitorFrameDropStats {
  private long sessionDuration;
  private double screenFrameRate;
  private int expectedFramesToBeDrawn;
  private int totalFramesDropped;
  private int totalFramesDrawn;
  private double framesDroppedRate;
  private double framesDrawnRate;

  public RNFrameRateMonitorFrameDropStats(long sessionDuration, double screenFrameRate, int expectedFramesToBeDrawn, int totalFramesDropped, int totalFramesDrawn, double framesDroppedRate, double framesDrawnRate) {
    this.sessionDuration = sessionDuration;
    this.screenFrameRate = screenFrameRate;
    this.expectedFramesToBeDrawn = expectedFramesToBeDrawn;
    this.totalFramesDropped = totalFramesDropped;
    this.totalFramesDrawn = totalFramesDrawn;
    this.framesDroppedRate = framesDroppedRate;
    this.framesDrawnRate = framesDrawnRate;
  }

  public WritableMap toWritableMap() {
    WritableMap map = Arguments.createMap();

    map.putInt("sessionDuration", (int) sessionDuration);
    map.putDouble("screenFrameRate", screenFrameRate);
    map.putInt("expectedFramesToBeDrawn", expectedFramesToBeDrawn);
    map.putInt("totalFramesDropped", totalFramesDropped);
    map.putInt("totalFramesDrawn", totalFramesDrawn);
    map.putDouble("framesDroppedRate", framesDroppedRate);
    map.putDouble("framesDrawnRate", framesDrawnRate);

    return map;
  }

  public String toJSON() {
    Gson gson = new Gson();
    return gson.toJson(this);
  }
}
