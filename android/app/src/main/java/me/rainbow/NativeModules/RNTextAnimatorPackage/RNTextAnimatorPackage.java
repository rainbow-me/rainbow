package me.rainbow.NativeModules.RNTextAnimatorPackage;

import android.graphics.Color;
import android.os.Build;
import android.os.Looper;
import android.text.SpannableString;
import android.text.SpannableStringBuilder;
import android.text.style.ForegroundColorSpan;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.text.ReactTextView;
import com.facebook.react.views.textinput.ReactEditText;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import android.os.Handler;
import javax.annotation.Nonnull;


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

    public UIUpdater(Runnable uiUpdater, int interval) {
        this(uiUpdater);
        UPDATE_INTERVAL = interval;
    }

    public synchronized void startUpdates() {
        mStatusChecker.run();
    }

    public synchronized void stopUpdates() {
        mHandler.removeCallbacks(mStatusChecker);
    }
}

public class RNTextAnimatorPackage implements ReactPackage {
    static int DECREASING = 150;
    static Field sEditListeners;
    static {
        sEditListeners = null;
        try {
            sEditListeners = ReactEditText.class.
                    getDeclaredField("mListeners");
            sEditListeners.setAccessible(true);

        } catch (NoSuchFieldException ignore) {}
    }

    public static String padRight(String s, int n) {
        return String.format("%1$-" + n + "s", s).replace(' ', '0');
    }

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
            public void animate(final int viewId, @Nonnull ReadableMap config) {
                double initialValue = config.getDouble("initialValue");
                double stepPerDay = config.getDouble("stepPerDay");
                boolean isStable = config.getBoolean("isStable");
                String color = config.getString("color");
                boolean darkMode = config.getBoolean("darkMode");
                String symbol = config.getString("symbol");
                final long date = System.currentTimeMillis();
                final Map<Integer, Character> prevVals = new HashMap<>();
                final Map<Integer, Integer> lastUpdate = new HashMap<>();
                UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
                uiManager.addUIBlock(nativeViewHierarchyManager -> {
                    ReactEditText view = (ReactEditText) nativeViewHierarchyManager.resolveView(viewId);
                    idsToViews.put(viewId, view);
                    try {
                        sEditListeners.set(view, null);
                    } catch (IllegalAccessException ignore) {}
                });
                UIUpdater handler = new UIUpdater(() -> {
                    if (idsToViews.containsKey(viewId)) {
                        ReactEditText view = idsToViews.get(viewId);
                        long diff = System.currentTimeMillis() - date;
                        String text = padRight(String.valueOf((float) initialValue + (diff * stepPerDay) / 24 / 60 / 60 / 1000), 12).substring(0, 12);
                        String parsedText = (isStable ? ('$' + text) : (text + ' ' + symbol)) + "    ";
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            view.setFontFeatureSettings("'tnum'");
                        }
                        SpannableStringBuilder builder = new SpannableStringBuilder();

                        for (int i = 0; i < parsedText.length(); i++) {
                            if (!prevVals.containsKey(i )) {
                                prevVals.put(i, parsedText.charAt(i));
                            }

                            if (!lastUpdate.containsKey(i)) {
                                lastUpdate.put(i, 0);
                            }

                            lastUpdate.put(i, Math.max(lastUpdate.get(i) - 1, 0));

                            if (prevVals.get(i) != parsedText.charAt(i)) {
                                lastUpdate.put(i, DECREASING);
                                for (int j = i + 1; j < parsedText.length() && parsedText.charAt(j) != ' '; j++) {
                                    lastUpdate.put(j, DECREASING + 1);
                                }
                            }

                            SpannableString str = new SpannableString(String.valueOf(parsedText.charAt(i)));

                            if (lastUpdate.get(i) > 0) {
                                int colors = Color.parseColor(color);


                                int reds = colors & 0x00ff0000;
                                int greens = colors & 0x0000ff00;
                                int blues = colors & 0x000000ff;

                                int colort = darkMode ? 0xFFFFFFFF : 0xFF000000;

                                int redt = colort & 0x00ff0000;
                                int greent = colort & 0x0000ff00;
                                int bluet = colort & 0x000000ff;

                                float lastUpdateValue = lastUpdate.get(i);

                                int red = (int) (lastUpdateValue / 300 * reds + redt * (1 - lastUpdateValue / DECREASING));
                                int blue = (int) (lastUpdateValue / 300 * blues + bluet * (1 - lastUpdateValue / DECREASING));
                                int green = (int) (lastUpdateValue / 300 * greens + greent * (1 - lastUpdateValue / DECREASING));

                                int newColor = 0xff000000 | blue & 0x000000ff | green & 0x0000ff00 | red & 0x00ff0000;


                                str.setSpan(new ForegroundColorSpan(newColor), 0, 1, 0);
                            }
                            prevVals.put(i, parsedText.charAt(i));
                            builder.append(str);

                        }

                        view.setText(builder);
                    }
                }, 30);

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

            @Override
            public void onCatalystInstanceDestroy() {
                Object[] keys = idsToHandler.keySet().toArray();
                for (Object viewId: keys) {
                    stop((Integer) viewId);
                }
                super.onCatalystInstanceDestroy();

            }
        });
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
