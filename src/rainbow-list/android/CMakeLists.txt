cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)
set (CMAKE_CXX_FLAGS "-DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_HAVE_MEMRCHR=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DON_ANDROID")

# Declares and names the project.

##project("newfeatures")
set (PACKAGE_NAME "rnultimatelist")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
#
## rnultimatelist shared
#

add_library(
        ${PACKAGE_NAME}
        SHARED
        cpp-adapter.cpp
        ../cpp/rainbow-me-ultimate-list.cpp
        ../cpp/ShareableNativeValue.cpp
        ${NODE_MODULES_DIR}/react-native/ReactCommon/jsi/jsi/jsi.cpp
        ${NODE_MODULES_DIR}/react-native/ReactCommon/jsi/jsi/JSIDynamic.cpp
)

# includes
#
file (GLOB LIBFBJNI_INCLUDE_DIR "${BUILD_DIR}/fbjni-*-headers.jar/")

# message(FATAL_ERROR "SDSDF: ${BUILD_DIR}/fbjni-*-headers.jar/")
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        ${LIBFBJNI_INCLUDE_DIR}
        ${BUILD_DIR}/third-party-ndk
        ${BUILD_DIR}/third-party-ndk/boost
        ${BUILD_DIR}/third-party-ndk/glog/exported
        ${BUILD_DIR}/third-party-ndk/double-conversion
        ${BUILD_DIR}/third-party-ndk/folly
        ${BUILD_DIR}/third-party-ndk/glog
        "${NODE_MODULES_DIR}/react-native/React"
        "${NODE_MODULES_DIR}/react-native/React/Base"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        "../cpp"
)


# find libraries

file (GLOB LIBRN_DIR "${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}")
file (GLOB LIBJSC_DIR "${BUILD_DIR}/android-jsc*.aar/jni/${ANDROID_ABI}")
file (GLOB HERMES_DIR "${BUILD_DIR}/third-party-ndk/hermes/jni/${ANDROID_ABI}")

#message(FATAL_ERROR "SDSDF: ${LIBRN_DIR} sdfsdf")

#essage(FATAL_ERROR "Looking for someheader.h - found ${BUILD_DIR} sdfsdf ${LIBRN_DIR} sdfsdf ${ANDROID_ABI} sdffsd")


find_library(
        LOG_LIB
        log
)
find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        REACT_NATIVE_JNI_LIB
        reactnativejni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        REACT_NATIVE_UTILS_LIB
        reactnativeutilsjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        FOLLY_JSON_LIB
        folly_json
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        GLOG_LIB
        glog
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
# linking

find_library(
        FBJNI_LIBRARY fbjni
        PATHS ${libfbjni_link_DIRS}
        NO_CMAKE_FIND_ROOT_PATH
)

# build shared lib

target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        ${REACT_NATIVE_JNI_LIB}
        ${REACT_NATIVE_UTILS_LIB}
        ${FBJNI_LIB}
        ${FOLLY_JSON_LIB}
        ${GLOG_LIB}
        android
)
