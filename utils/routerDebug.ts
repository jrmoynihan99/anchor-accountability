// utils/routerDebug.ts
import { router } from "expo-router";

// Wrap router.push with logging
const originalPush = router.push;
router.push = function (href: any) {
  console.log("🚀 router.push called with:", href);
  console.trace("🚀 router.push call stack");
  return originalPush.call(this, href);
};

// Wrap router.replace with logging
const originalReplace = router.replace;
router.replace = function (href: any) {
  console.log("🚀 router.replace called with:", href);
  console.trace("🚀 router.replace call stack");
  return originalReplace.call(this, href);
};

// Wrap router.back with logging
const originalBack = router.back;
router.back = function () {
  console.log("🚀 router.back called");
  console.trace("🚀 router.back call stack");
  return originalBack.call(this);
};
