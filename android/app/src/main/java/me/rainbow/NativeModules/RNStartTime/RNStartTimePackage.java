package me.rainbow.NativeModules.RNStartTime;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.oblador.keychain.KeychainModuleBuilder;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import me.rainbow.NativeModules.Internals.InternalModule;

public class RNStartTimePackage implements ReactPackage {
    private final long START_MARK;

    public RNStartTimePackage(long startMark) {
        START_MARK = startMark;
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(new RNStartTimeModule(START_MARK));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
