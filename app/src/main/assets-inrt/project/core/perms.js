// 权限检查/请求 - 不依赖 floaty.checkPermission 之类的可能不存在的快捷 API
// 用 Android 原生 API，更稳

function _ctx() {
    try { return context; } catch (e) {}
    try { return activity; } catch (e) {}
    try { return com.stardust.app.GlobalAppContext.get(); } catch (e) {}
    return null;
}

function canDrawOverlays() {
    const ctx = _ctx();
    if (!ctx) return false;
    try {
        return android.provider.Settings.canDrawOverlays(ctx);
    } catch (e) {
        return false;
    }
}

function requestOverlay() {
    const ctx = _ctx();
    if (!ctx) return;
    try {
        const Intent = android.content.Intent;
        const Uri = android.net.Uri;
        const intent = new Intent(
            android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + ctx.getPackageName())
        );
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(intent);
    } catch (e) {
        toast("请去设置 → 应用 → 模拟拉人 → 显示在其他应用上层 → 打开");
    }
}

function hasAccessibility() {
    try { return !!auto.service; } catch (e) {}
    try {
        const cls = Packages.org.autojs.autojs.core.accessibility.AccessibilityService;
        return cls.getInstance() !== null;
    } catch (e) {}
    return false;
}

function requestAccessibility() {
    const ctx = _ctx();
    if (!ctx) return;
    try {
        const Intent = android.content.Intent;
        const intent = new Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(intent);
    } catch (e) {
        toast("请去 设置 → 无障碍 → 找到模拟拉人/AutoJs6 → 打开");
    }
}

module.exports = {
    canDrawOverlays: canDrawOverlays,
    requestOverlay: requestOverlay,
    hasAccessibility: hasAccessibility,
    requestAccessibility: requestAccessibility,
};
