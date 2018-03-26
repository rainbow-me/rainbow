#import <FirebaseAnalytics/FirebaseAnalytics.h>
#import <FirebaseCore/FirebaseCore.h>

#if !defined(__has_include)
  #error "Firebase.h won't import anything if your compiler doesn't support __has_include. Please \
          import the headers individually."
#else
  #if __has_include(<FirebaseAppIndexing/FirebaseAppIndexing.h>)
    #import <FirebaseAppIndexing/FirebaseAppIndexing.h>
  #endif

  #if __has_include(<FirebaseAuth/FirebaseAuth.h>)
    #import <FirebaseAuth/FirebaseAuth.h>
  #endif

  #if __has_include(<FirebaseCrash/FirebaseCrash.h>)
    #import <FirebaseCrash/FirebaseCrash.h>
  #endif

  #if __has_include(<FirebaseDatabase/FirebaseDatabase.h>)
    #import <FirebaseDatabase/FirebaseDatabase.h>
  #endif

  #if __has_include(<FirebaseDynamicLinks/FirebaseDynamicLinks.h>)
    #import <FirebaseDynamicLinks/FirebaseDynamicLinks.h>
  #endif

  #if __has_include(<FirebaseFirestore/FirebaseFirestore.h>)
    #import <FirebaseFirestore/FirebaseFirestore.h>
  #endif

  #if __has_include(<FirebaseInstanceID/FirebaseInstanceID.h>)
    #import <FirebaseInstanceID/FirebaseInstanceID.h>
  #endif

  #if __has_include(<FirebaseInvites/FirebaseInvites.h>)
    #import <FirebaseInvites/FirebaseInvites.h>
  #endif

  #if __has_include(<FirebaseMessaging/FirebaseMessaging.h>)
    #import <FirebaseMessaging/FirebaseMessaging.h>
  #endif

  #if __has_include(<FirebasePerformance/FirebasePerformance.h>)
    #import <FirebasePerformance/FirebasePerformance.h>
  #endif

  #if __has_include(<FirebaseRemoteConfig/FirebaseRemoteConfig.h>)
    #import <FirebaseRemoteConfig/FirebaseRemoteConfig.h>
  #endif

  #if __has_include(<FirebaseStorage/FirebaseStorage.h>)
    #import <FirebaseStorage/FirebaseStorage.h>
  #endif

  #if __has_include(<GoogleMobileAds/GoogleMobileAds.h>)
    #import <GoogleMobileAds/GoogleMobileAds.h>
  #endif

  #if __has_include(<Fabric/Fabric.h>)
    #import <Fabric/Fabric.h>
  #endif

  #if __has_include(<Crashlytics/Crashlytics.h>)
    #import <Crashlytics/Crashlytics.h>
  #endif

#endif  // defined(__has_include)
