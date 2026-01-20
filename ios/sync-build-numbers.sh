#!/bin/bash

echo "========== SYNC BUILD NUMBERS DEBUG =========="
echo "Working directory: $(pwd)"
echo "Listing ios directory:"
ls -la ios/

echo ""
echo "---Anchor Info.plist---"
if [ -f "ios/Anchor/Info.plist" ]; then
  /usr/libexec/PlistBuddy -c "Print" ios/Anchor/Info.plist || echo "Failed to read Anchor Info.plist"
else
  echo "ios/Anchor/Info.plist does NOT exist"
fi

echo ""
echo "---AnchorClip Info.plist---"
if [ -f "ios/AnchorClip/Info.plist" ]; then
  /usr/libexec/PlistBuddy -c "Print" ios/AnchorClip/Info.plist || echo "Failed to read AnchorClip Info.plist"
else
  echo "ios/AnchorClip/Info.plist does NOT exist"
fi

echo ""
echo "---Checking project.pbxproj for CURRENT_PROJECT_VERSION---"
grep "CURRENT_PROJECT_VERSION" ios/Anchor.xcodeproj/project.pbxproj | head -5

echo "========== END DEBUG =========="