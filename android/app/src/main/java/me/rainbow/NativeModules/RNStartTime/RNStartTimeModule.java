package me.rainbow.NativeModules.RNStartTime;

import android.os.Process;
import android.os.SystemClock;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

public class RNStartTimeModule extends ReactContextBaseJavaModule {
    public static final String NAME = "RNStartTime";
    private final long START_MARK;

    public RNStartTimeModule(long startMark) {
        START_MARK = startMark;
    }

    @Override
    public String getName() {
        return NAME;
    }


    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("START_TIME", START_MARK);
        return constants;
    }
}
