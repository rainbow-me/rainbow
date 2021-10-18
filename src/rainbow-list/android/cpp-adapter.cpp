#include <jni.h>
#include <jsi/jsi.h>
#include <memory>
#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>
#include <react/jni/JavaScriptExecutorHolder.h>
#include <android/log.h>

#include "../../../cpp/rainbow-me-ultimate-list.h"


#include <react/jni/CxxModuleWrapper.h>
#include <react/jni/JMessageQueueThread.h>
//#include "ErrorHandler.h"
#include <jni.h>
#include <memory>
//#include "Logger.h"

std::string jstring2string(JNIEnv *env, jstring jStr) {
    if (!jStr)
        return "";

    const jclass stringClass = env->GetObjectClass(jStr);
    const jmethodID getBytes = env->GetMethodID(stringClass, "getBytes", "(Ljava/lang/String;)[B");
    const jbyteArray stringJbytes = (jbyteArray) env->CallObjectMethod(jStr, getBytes, env->NewStringUTF("UTF-8"));

    size_t length = (size_t) env->GetArrayLength(stringJbytes);
    jbyte* pBytes = env->GetByteArrayElements(stringJbytes, NULL);

    std::string ret = std::string((char *)pBytes, length);
    env->ReleaseByteArrayElements(stringJbytes, pBytes, JNI_ABORT);

    env->DeleteLocalRef(stringJbytes);
    env->DeleteLocalRef(stringClass);
    return ret;
}

JavaVM* g_jvm = 0;



using namespace facebook;


struct UltimateListModule : jni::JavaClass<UltimateListModule> {
public:
    __unused static constexpr auto kJavaDescriptor = "Lcom/rainbowmeultimatelist/UltimateNativeModule;";

    static constexpr auto TAG = "rnultimatelist";

    static void registerNatives() {
        javaClassStatic()->registerNatives({
                                                   makeNativeMethod("installNative",
                                                                    UltimateListModule::installNative),
                                                   makeNativeMethod("getStringValueAtIndexByKey",
                                                                    UltimateListModule::getStringValueAtIndexByKey),
                                                   makeNativeMethod("getTypeAtIndex",
                                                                    UltimateListModule::getTypeAtIndex),
                                                   makeNativeMethod("getHashAtIndex",
                                                                    UltimateListModule::getHashAtIndex),
                                                   makeNativeMethod("getIsHeaderAtIndex",
                                                                    UltimateListModule::getIsHeaderAtIndex),
                                                   makeNativeMethod("getLength",
                                                                    UltimateListModule::getLength),
                                                   makeNativeMethod("getAdded",
                                                                    UltimateListModule::getAdded),
                                                   makeNativeMethod("getRemoved",
                                                                    UltimateListModule::getRemoved),
                                                   makeNativeMethod("getMoved",
                                                                    UltimateListModule::getMoved),
                                                   makeNativeMethod("setNotifier",
                                                                    UltimateListModule::setNotifier),
                                                   makeNativeMethod("moveFromPreSet",
                                                                    UltimateListModule::moveFromPreSet),
                                           });
    }

private:
    static std::shared_ptr<react::JSExecutorFactory> makeJSExecutorFactory() {
        __android_log_write(ANDROID_LOG_INFO, TAG, "Calling Java method UltimateListModule.makeJSExecutor()...");
        static const auto cls = javaClassStatic();
        static const auto method = cls->getStaticMethod<react::JavaScriptExecutorHolder()>("makeJSExecutor");
        auto result = method(cls);
        __android_log_write(ANDROID_LOG_INFO, TAG, "JavaScriptExecutor created! Getting factory...");
        return result->cthis()->getExecutorFactory();
    }

    static void installNative(jni::alias_ref<JClass>,
                              jlong jsiRuntimePointer) {


        auto runtime = reinterpret_cast<jsi::Runtime*>(jsiRuntimePointer);
        osdnk::ultimatelist::installSimple(*runtime);

    }

    static jbyteArray getStringValueAtIndexByKey(JNIEnv *env, jclass clazz,
                                                 jint index, jstring key, jint id) {
        std::string value = osdnk::ultimatelist::obtainStringValueAtIndexByKey(index, jstring2string(env, key), id);
        int byteCount = value.length();
        jbyte* pNativeMessage = const_cast<jbyte *>(reinterpret_cast<const jbyte *>(value.c_str()));
        jbyteArray bytes = env->NewByteArray(byteCount);
        env->SetByteArrayRegion(bytes, 0, byteCount, pNativeMessage);
        return  bytes;
    }


    static jbyteArray getHashAtIndex(JNIEnv *env, jclass clazz,
                                     jint index, jint id) {
        std::string value = osdnk::ultimatelist::obtainHashValueAtIndex(index, id);
        int byteCount = value.length();
        jbyte* pNativeMessage = const_cast<jbyte *>(reinterpret_cast<const jbyte *>(value.c_str()));
        jbyteArray bytes = env->NewByteArray(byteCount);
        env->SetByteArrayRegion(bytes, 0, byteCount, pNativeMessage);
        return  bytes;
    }

    static jbyteArray getTypeAtIndex(JNIEnv *env, jclass clazz,
                                     jint index, jint id) {
        std::string value = osdnk::ultimatelist::obtainTypeAtIndexByKey(index, id);
        int byteCount = value.length();
        jbyte* pNativeMessage = const_cast<jbyte *>(reinterpret_cast<const jbyte *>(value.c_str()));
        jbyteArray bytes = env->NewByteArray(byteCount);
        env->SetByteArrayRegion(bytes, 0, byteCount, pNativeMessage);
        return  bytes;
    }

    static jboolean getIsHeaderAtIndex(JNIEnv *env, jclass clazz,
                                       jint index, jint id) {
        bool isHeader = osdnk::ultimatelist::obtainIsHeaderAtIndex(index, id);

        return  isHeader;
    }

    static jint getLength(JNIEnv *env, jclass clazz,
                          jint id) {
        return osdnk::ultimatelist::obtainCount(id);
    }



    static jintArray getRemoved(JNIEnv *env, jclass clazz,
                                jint id) {
        auto removedIndices = osdnk::ultimatelist::obtainRemovedIndices(id);
        jintArray arr = env->NewIntArray( removedIndices.size() );
        env->SetIntArrayRegion( arr, 0, removedIndices.size(), ( jint * ) &removedIndices[0] );
        return arr;
    }

    static jintArray getMoved(JNIEnv *env, jclass clazz,
                              jint id) {
        auto movedIndices = osdnk::ultimatelist::obtainMovedIndices(id);
        jintArray arr = env->NewIntArray( movedIndices.size() );
        env->SetIntArrayRegion( arr, 0, movedIndices.size(), ( jint * ) &movedIndices[0] );
        return arr;
    }


    static jintArray getAdded(JNIEnv *env, jclass clazz,
                              jint id) {
        auto removedIndices = osdnk::ultimatelist::obtainNewIndices(id);
        jintArray arr = env->NewIntArray( removedIndices.size() );
        env->SetIntArrayRegion( arr, 0, removedIndices.size(), ( jint * ) &removedIndices[0] );
        return arr;
    }

    static void moveFromPreSet(JNIEnv *env, jclass clazz,
                               jint id) {
        osdnk::ultimatelist::moveFromPreSet(id);
    }




    static void setNotifier(JNIEnv *env, jclass clazz) {
        env->GetJavaVM(&g_jvm);

        auto method = javaClassStatic()->getStaticMethod<void(int)>("notifyNewData");

        auto notifyNewDataCallback = [method](int id) {
            method(javaClassStatic(), id);
        };
        osdnk::ultimatelist::setNotifyNewData(notifyNewDataCallback);
    }


};

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
    return facebook::jni::initialize(vm, [] {
        UltimateListModule::registerNatives();
    });
}

