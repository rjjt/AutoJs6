const Anti = require("./Anti.js");

const QQ_PKG = "com.tencent.mobileqq";
const TIMEOUT_FAST = 5000;
const TIMEOUT_SLOW = 12000;

function ensureQQForeground() {
    if (currentPackage() !== QQ_PKG) {
        app.launch(QQ_PKG);
        sleep(2500);
    }
}

function safeClick(node) {
    if (!node) return false;
    if (node.clickable()) return node.click();
    const b = node.bounds();
    return click(b.centerX(), b.centerY());
}

function gotoSourceGroup(cfg, log) {
    log("打开 QQ");
    ensureQQForeground();
    sleep(1500);

    const t = textContains(cfg.sourceGroup).findOne(TIMEOUT_SLOW);
    if (!t) throw new Error("找不到源群: " + cfg.sourceGroup);
    log("点击源群: " + cfg.sourceGroup);
    safeClick(t);
    sleep(1800);
}

function openInvitePage(cfg, log) {
    log("打开聊天信息页");
    const menu = desc("聊天设置").findOne(TIMEOUT_FAST)
              || desc("更多").findOne(TIMEOUT_FAST)
              || id("conversation_menu").findOne(TIMEOUT_FAST);
    if (!menu) throw new Error("找不到右上角菜单按钮");
    safeClick(menu);
    sleep(1500);

    log("点击邀请按钮");
    const inviteBtn = text("邀请").findOne(TIMEOUT_FAST)
                  || desc("邀请").findOne(TIMEOUT_FAST);
    if (!inviteBtn) throw new Error("找不到邀请按钮");
    safeClick(inviteBtn);
    Anti.actionDelay(cfg);

    log("点击 从群聊中选择联系人");
    const fromGroup = text("从群聊中选择联系人").findOne(TIMEOUT_FAST);
    if (!fromGroup) throw new Error("找不到\"从群聊中选择联系人\"");
    safeClick(fromGroup);
    Anti.actionDelay(cfg);
}

function collapseCreatedGroups(cfg, log) {
    const created = text("我创建的群聊").findOne(TIMEOUT_FAST);
    if (!created) {
        log("没找到\"我创建的群聊\"标题（可能已折叠）");
        return;
    }
    log("折叠 我创建的群聊");
    safeClick(created);
    Anti.actionDelay(cfg);
}

function expandJoinedGroups(cfg, log) {
    const joined = text("我加入的群聊").findOne(TIMEOUT_SLOW);
    if (!joined) throw new Error("找不到\"我加入的群聊\"标题");
    log("展开 我加入的群聊");
    safeClick(joined);
    Anti.actionDelay(cfg);
}

function findAndEnterTarget(targetName, cfg, log) {
    log("寻找目标群: " + targetName);
    let attempts = 0;
    const maxAttempts = 25;
    while (attempts < maxAttempts) {
        const node = textContains(targetName).findOne(2000);
        if (node) {
            log("点击进入: " + targetName);
            safeClick(node);
            sleep(2000);
            return true;
        }
        const w = device.width || 1080;
        const h = device.height || 1920;
        swipe(w / 2, h * 0.75, w / 2, h * 0.35, 500);
        sleep(randIntInline(600, 1100));
        attempts++;
    }
    throw new Error("滑动 " + maxAttempts + " 次仍找不到目标群: " + targetName);
}

function randIntInline(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function backToSourceGroup(cfg, log) {
    log("返回到源群");
    let safety = 0;
    while (safety++ < 6) {
        if (currentPackage() === QQ_PKG && textContains(cfg.sourceGroup).findOne(800)) return;
        back();
        sleep(800);
    }
}

module.exports = {
    QQ_PKG: QQ_PKG,
    ensureQQForeground: ensureQQForeground,
    gotoSourceGroup: gotoSourceGroup,
    openInvitePage: openInvitePage,
    collapseCreatedGroups: collapseCreatedGroups,
    expandJoinedGroups: expandJoinedGroups,
    findAndEnterTarget: findAndEnterTarget,
    backToSourceGroup: backToSourceGroup,
};
