#!/bin/bash

# Get the build number from the main app
MAIN_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" Anchor/Info.plist)

echo "Main app build number: $MAIN_BUILD_NUMBER"

# Set the App Clip build number to match
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $MAIN_BUILD_NUMBER" AnchorClip/Info.plist

echo "App Clip build number updated to: $MAIN_BUILD_NUMBER"

# Verify they match
CLIP_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" AnchorClip/Info.plist)
echo "Verification - Main: $MAIN_BUILD_NUMBER, Clip: $CLIP_BUILD_NUMBER"