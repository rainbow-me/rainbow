package me.rainbow.NativeModules.RNTextAnimatorPackage;

import android.os.Looper;
import android.text.Spannable;
import android.util.Log;
import android.view.View;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.textinput.ReactEditText;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import android.os.Handler;


class UIUpdater {
    private Handler mHandler = new Handler(Looper.getMainLooper());
    private Runnable mStatusChecker;
    private int UPDATE_INTERVAL = 2000;
    public UIUpdater(final Runnable uiUpdater) {
        mStatusChecker = new Runnable() {
            @Override
            public void run() {
                uiUpdater.run();
                mHandler.postDelayed(this, UPDATE_INTERVAL);
            }
        };
    }
    public UIUpdater(Runnable uiUpdater, int interval){
        this(uiUpdater);
        UPDATE_INTERVAL = interval;
    }
    public synchronized void startUpdates(){
        mStatusChecker.run();
    }

    public synchronized void stopUpdates(){
        mHandler.removeCallbacks(mStatusChecker);
    }
}

public class RNTextAnimatorPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.asList(new ReactContextBaseJavaModule() {
            @Override
            public String getName() {
                return "RNTextAnimator";
            }

            final Map<Integer, ReactEditText> idsToViews = new HashMap<>();
            final Map<Integer, UIUpdater> idsToHandler = new HashMap<>();

            @ReactMethod
            public void animate(final int viewId, ReadableMap config) {
                double initialValue = config.getDouble("initialValue");
                double stepPerDay = config.getDouble("stepPerDay");
                boolean isStable = config.getBoolean("isStable");
                String symbol = config.getString("symbol");
                final long date = System.currentTimeMillis();
                UIUpdater handler = new UIUpdater(() -> {
                    UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
                    uiManager.addUIBlock(nativeViewHierarchyManager -> {
                        idsToViews.put(viewId, (ReactEditText)nativeViewHierarchyManager.resolveView(viewId));
                    });
                    if (idsToViews.containsKey(viewId)) {
                        ReactEditText view = idsToViews.get(viewId);
                        long diff = System.currentTimeMillis() - date;
                        String text = String.valueOf((float)initialValue + (diff * stepPerDay) / 24 / 60 / 60 / 1000).substring(0, 12);
                        view.setText((isStable ? ('$' + text) : (text + ' ' + symbol)) + "    ");
                    }
                }, 10);
                handler.startUpdates();
                idsToHandler.put(viewId, handler);
            }

            @ReactMethod
            public void stop(final int viewId) {
                UIUpdater handler = idsToHandler.get(viewId);
                handler.stopUpdates();
                idsToViews.remove(viewId);
                idsToHandler.remove(viewId);

            }
        });
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
