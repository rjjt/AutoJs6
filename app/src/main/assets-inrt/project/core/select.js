const Anti = require("./anti.js");

const TIMEOUT_FAST = 4000;

function findCheckableItems() {
    return className("CheckBox").find()
        .empty() ? className("android.widget.CheckBox").find() : className("CheckBox").find();
}

function checkBatch(cfg, remaining, log) {
    const want = Math.min(cfg.batchSize, remaining);
    log("本批次目标: " + want + " 人");

    const checkedSet = {};
    let checked = 0;
    let scrollRounds = 0;
    const maxScrolls = 30;

    while (checked < want && scrollRounds < maxScrolls) {
        const candidates = collectCandidates();
        let progressedThisPass = false;

        for (let i = 0; i < candidates.length && checked < want; i++) {
            const c = candidates[i];
            if (checkedSet[c.key]) continue;
            if (c.isChecked) {
                checkedSet[c.key] = true;
                continue;
            }
            if (clickItem(c)) {
                checkedSet[c.key] = true;
                checked++;
                progressedThisPass = true;
                Anti.actionDelay(cfg);
            }
        }

        if (checked >= want) break;

        const w = device.width || 1080;
        const h = device.height || 1920;
        swipe(w / 2, h * 0.75, w / 2, h * 0.35, 500);
        sleep(Anti.randInt(700, 1300));
        scrollRounds++;
        if (!progressedThisPass) {
        }
    }

    log("实际勾选 " + checked + " 人 (滑动 " + scrollRounds + " 轮)");
    return checked;
}

function collectCandidates() {
    const items = [];
    const checkboxes = className("android.widget.CheckBox").find();
    if (checkboxes.empty()) {
        const imgs = className("android.widget.ImageView").clickable(true).find();
        imgs.forEach(function (n) {
            const b = n.bounds();
            items.push({
                node: n,
                key: b.left + "," + b.top + "," + b.right + "," + b.bottom,
                bounds: b,
                isChecked: false,
            });
        });
        return items;
    }
    checkboxes.forEach(function (n) {
        const b = n.bounds();
        items.push({
            node: n,
            key: b.left + "," + b.top + "," + b.right + "," + b.bottom,
            bounds: b,
            isChecked: !!n.checked(),
        });
    });
    return items;
}

function clickItem(c) {
    if (c.node && c.node.clickable()) return c.node.click();
    return click(c.bounds.centerX(), c.bounds.centerY());
}

function submitInvite(cfg, log) {
    const btn = text("立即邀请").findOne(TIMEOUT_FAST)
             || desc("立即邀请").findOne(TIMEOUT_FAST)
             || textContains("邀请").clickable(true).findOne(TIMEOUT_FAST);
    if (!btn) throw new Error("找不到\"立即邀请\"按钮");
    log("点击立即邀请");
    if (btn.clickable()) {
        btn.click();
    } else {
        const b = btn.bounds();
        click(b.centerX(), b.centerY());
    }
    sleep(2500);
    dismissPostInviteDialog();
}

function dismissPostInviteDialog() {
    const okBtn = text("确定").findOne(2500)
               || text("我知道了").findOne(2500)
               || text("好的").findOne(2500);
    if (okBtn) {
        if (okBtn.clickable()) okBtn.click();
        else {
            const b = okBtn.bounds();
            click(b.centerX(), b.centerY());
        }
        sleep(1000);
    }
}

module.exports = {
    checkBatch: checkBatch,
    submitInvite: submitInvite,
};
