package me.rainbow.NativeModules.RNBackHandler;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RNBackHandlerPackage implements ReactPackage {
    public static boolean sBlockBack = false;

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.asList(new ReactContextBaseJavaModule() {
            @Override
            public String getName() {
                return "RNBackHandler";
            }

            @ReactMethod
            public void setBlockBackButton(final boolean shouldBlockBackButton) {
                sBlockBack = shouldBlockBackButton;
            }
        });
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
