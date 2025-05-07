#!/bin/bash

xcodebuild -workspace ios/Rainbow.xcworkspace -scheme Rainbow -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -parallelizeTargets -quiet BUILD_LIBRARY_FOR_DISTRIBUTION=YES COMPILER_INDEX_STORE_ENABLE=NO
