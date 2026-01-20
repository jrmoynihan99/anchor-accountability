#!/bin/bash

# Get the main app's build number
MAIN_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${PROJECT_DIR}/Anchor/Info.plist")

# Set the App Clip's build number to match
/usr/libexec/PlistBuddy -c "Set CFBundleVersion $MAIN_BUILD_NUMBER" "${PROJECT_DIR}/AnchorClip/Info.plist"

echo "Synced App Clip build number to: $MAIN_BUILD_NUMBER"