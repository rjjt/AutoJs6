const Storage = require("../core/Storage.js");
const Engine = require("../core/Engine.js");
const Floating = require("./Floating.js");

function buildLayout() {
    return (
        <ScrollView>
            <vertical padding="16">
                <text text="模拟拉人" textSize="22sp" textColor="#1f2937" />
                <text id="versionLabel" textSize="11sp" textColor="#94a3b8" />

                <text text="📋 群配置" textSize="16sp" textColor="#374151" margin="0 16 0 0" />

                <text text="源群名称（你自己的群，被邀请人会进这里）" textSize="12sp" textColor="#6b7280" margin="0 8 0 0" />
                <input id="sourceGroup" hint="例如：宝藏库📦54" />

                <text text="目标群（每行一个，按顺序处理）" textSize="12sp" textColor="#6b7280" margin="0 12 0 0" />
                <input id="targetGroups" inputType="textMultiLine" minLines="4" hint="目标群A&#10;目标群B&#10;目标群C" />

                <text text="（群名称要和 QQ 里完全一致，包括 emoji 和数字编号）" textSize="11sp" textColor="#9ca3af" margin="0 4 0 0" />

                <text text="⚙️ 邀请参数" textSize="16sp" textColor="#374151" margin="0 18 0 0" />

                <horizontal gravity="center_vertical" margin="0 6 0 0">
                    <text text="每批勾选数：" w="130" />
                    <input id="batchSize" inputType="number" w="80" />
                </horizontal>

                <horizontal gravity="center_vertical" margin="0 6 0 0">
                    <text text="批次间隔(分)：" w="130" />
                    <input id="batchIntervalMin" inputType="numberDecimal" w="60" />
                    <text text="～" margin="6 0 6 0" />
                    <input id="batchIntervalMax" inputType="numberDecimal" w="60" />
                </horizontal>

                <horizontal gravity="center_vertical" margin="0 6 0 0">
                    <text text="每日上限：" w="130" />
                    <input id="dailyLimit" inputType="number" w="80" />
                </horizontal>

                <horizontal gravity="center_vertical" margin="0 6 0 0">
                    <text text="操作延迟(秒)：" w="130" />
                    <input id="actionDelayMin" inputType="numberDecimal" w="60" />
                    <text text="～" margin="6 0 6 0" />
                    <input id="actionDelayMax" inputType="numberDecimal" w="60" />
                </horizontal>

                <horizontal gravity="center_vertical" margin="0 6 0 0">
                    <checkbox id="quietHours" />
                    <text text=" 凌晨保护：" />
                    <input id="quietStart" inputType="number" w="50" />
                    <text text="～" margin="4 0 4 0" />
                    <input id="quietEnd" inputType="number" w="50" />
                    <text text=" 点禁用" />
                </horizontal>

                <text text="📊 今日进度" textSize="16sp" textColor="#374151" margin="0 18 0 0" />
                <text id="progressLabel" textSize="14sp" textColor="#059669" />

                <text text="🔧 权限" textSize="16sp" textColor="#374151" margin="0 18 0 0" />
                <text id="permsLabel" textSize="13sp" textColor="#6b7280" />

                <horizontal gravity="center" margin="0 18 0 0">
                    <button id="btnSave" text="保存配置" w="0" layout_weight="1" margin="0 0 6 0" />
                    <button id="btnStart" text="开始" w="0" layout_weight="1" bg="#2563eb" textColor="#ffffff" margin="6 0 0 0" />
                </horizontal>

                <horizontal gravity="center" margin="0 6 0 0">
                    <button id="btnCheckPerms" text="检查权限" w="0" layout_weight="1" margin="0 0 6 0" />
                    <button id="btnResetToday" text="清空今日" w="0" layout_weight="1" margin="6 0 0 0" />
                </horizontal>
            </vertical>
        </ScrollView>
    );
}

function init() {
    ui.layout(buildLayout());

    const cfg = Storage.loadConfig();

    ui.versionLabel.setText("v0.1.0  " + new Date().toISOString().slice(0, 10));
    ui.sourceGroup.setText(cfg.sourceGroup || "");
    ui.targetGroups.setText((cfg.targetGroups || []).join("\n"));
    ui.batchSize.setText(String(cfg.batchSize));
    ui.batchIntervalMin.setText(String(cfg.batchIntervalMin));
    ui.batchIntervalMax.setText(String(cfg.batchIntervalMax));
    ui.dailyLimit.setText(String(cfg.dailyLimit));
    ui.actionDelayMin.setText(String(cfg.actionDelayMin));
    ui.actionDelayMax.setText(String(cfg.actionDelayMax));
    ui.quietHours.setChecked(!!cfg.quietHours);
    ui.quietStart.setText(String(cfg.quietStart));
    ui.quietEnd.setText(String(cfg.quietEnd));

    renderProgress();
    renderPerms();

    ui.btnSave.click(function () {
        const c = readForm();
        Storage.saveConfig(c);
        toast("已保存");
        renderProgress();
    });

    ui.btnStart.click(function () {
        const c = readForm();
        if (!c.sourceGroup) { toast("请填源群名称"); return; }
        if (c.targetGroups.length === 0) { toast("请填至少一个目标群"); return; }
        Storage.saveConfig(c);

        if (!auto.service) {
            toast("请先开启无障碍服务");
            app.startActivity({ action: "android.settings.ACCESSIBILITY_SETTINGS" });
            return;
        }
        if (!floaty.checkPermission()) {
            toast("请先授予悬浮窗权限");
            floaty.requestPermission();
            return;
        }

        Floating.show({});
        Engine.start();
        toast("开始运行 - 切到 QQ，悬浮窗会跟着你");
    });

    ui.btnCheckPerms.click(function () {
        renderPerms();
        toast("已刷新");
    });

    ui.btnResetToday.click(function () {
        dialogs.confirm("确认清空今日已邀请记录？").then(function (yes) {
            if (yes) {
                Storage.resetToday();
                renderProgress();
                toast("已清空");
            }
        });
    });
}

function readForm() {
    const targets = String(ui.targetGroups.getText() || "")
        .split(/\r?\n/)
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });

    return {
        sourceGroup: String(ui.sourceGroup.getText() || "").trim(),
        targetGroups: targets,
        batchSize: parseInt(ui.batchSize.getText()) || Storage.DEFAULTS.batchSize,
        batchIntervalMin: parseFloat(ui.batchIntervalMin.getText()) || Storage.DEFAULTS.batchIntervalMin,
        batchIntervalMax: parseFloat(ui.batchIntervalMax.getText()) || Storage.DEFAULTS.batchIntervalMax,
        dailyLimit: parseInt(ui.dailyLimit.getText()) || Storage.DEFAULTS.dailyLimit,
        actionDelayMin: parseFloat(ui.actionDelayMin.getText()) || Storage.DEFAULTS.actionDelayMin,
        actionDelayMax: parseFloat(ui.actionDelayMax.getText()) || Storage.DEFAULTS.actionDelayMax,
        quietHours: !!ui.quietHours.isChecked(),
        quietStart: parseInt(ui.quietStart.getText()) || 0,
        quietEnd: parseInt(ui.quietEnd.getText()) || 7,
    };
}

function renderProgress() {
    const cfg = Storage.loadConfig();
    const cur = Storage.getTodayCount();
    ui.progressLabel.setText("今日已邀请 " + cur + " / " + cfg.dailyLimit);
}

function renderPerms() {
    const a11y = !!auto.service;
    const flo = floaty.checkPermission();
    ui.permsLabel.setText(
        (a11y ? "✅" : "❌") + " 无障碍服务   " +
        (flo ? "✅" : "❌") + " 悬浮窗权限"
    );
}

module.exports = {
    init: init,
};
