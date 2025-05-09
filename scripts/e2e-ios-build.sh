#!/bin/bash

xcodebuild -workspace ios/Rainbow.xcworkspace -scheme Rainbow -configuration Release -sdk iphonesimulator -derivedDataPath ~/Library/Developer/Xcode/DerivedData
