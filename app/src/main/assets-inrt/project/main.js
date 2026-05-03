"ui";

// === DEV MODE ============================================================
// If /sdcard/qqinvite/main.js exists, load THAT instead of the bundled
// scripts. This lets you iterate on the script without rebuilding the APK:
//   adb push project/. /sdcard/qqinvite/
//   关掉 APP 重开
// To exit dev mode just delete /sdcard/qqinvite/.
// =========================================================================

const DEV_MAIN = "/sdcard/qqinvite/main.js";

let useDev = false;
try { useDev = files.exists(DEV_MAIN); } catch (e) {}

if (useDev) {
    toast("[DEV] " + DEV_MAIN);
    console.log("[DEV] running " + DEV_MAIN);
    require(DEV_MAIN);
} else {
    const Settings = require("./ui/settings.js");
    Settings.init();
}
