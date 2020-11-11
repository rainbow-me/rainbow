package me.rainbow.NativeModules.RNReview;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;
import com.google.android.play.core.tasks.Task;

public class RNReviewModule extends ReactContextBaseJavaModule {
    @Override
    public String getName() {
        return "RNReview";
    }

    @ReactMethod
    public void show(final Promise promise) {
        ReviewManager manager = ReviewManagerFactory.create(getReactApplicationContext());
        Task<ReviewInfo> request = manager.requestReviewFlow();
        request.addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                // We can get the ReviewInfo object
                ReviewInfo reviewInfo = task.getResult();
            } else {
                // There was some problem, continue regardless of the result.
            }
        });
    }

}
