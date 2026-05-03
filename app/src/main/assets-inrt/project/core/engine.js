const Storage = require("./storage.js");
const Anti = require("./anti.js");
const Nav = require("./nav.js");
const Select = require("./select.js");

const STATE = { IDLE: "IDLE", RUNNING: "RUNNING", PAUSED: "PAUSED", STOPPED: "STOPPED" };

let _state = STATE.IDLE;
let _thread = null;
let _floatingHooks = null;
let _onStateChange = null;
let _lastError = null;

function getState() { return _state; }

function setFloating(hooks) { _floatingHooks = hooks; }
function setOnStateChange(cb) { _onStateChange = cb; }

function _setState(s) {
    _state = s;
    if (_onStateChange) try { _onStateChange(s); } catch (e) {}
    if (_floatingHooks && _floatingHooks.onState) try { _floatingHooks.onState(s); } catch (e) {}
}

function _emitProgress(count, limit) {
    if (_floatingHooks && _floatingHooks.onProgress) {
        try { _floatingHooks.onProgress(count, limit); } catch (e) {}
    }
}

function _log(msg) {
    console.log(msg);
    Storage.pushLog(msg);
    if (_floatingHooks && _floatingHooks.onLog) {
        try { _floatingHooks.onLog(msg); } catch (e) {}
    }
}

function start() {
    if (_state === STATE.RUNNING || _state === STATE.PAUSED) return false;
    _lastError = null;
    _setState(STATE.RUNNING);
    _thread = threads.start(_runLoop);
    return true;
}

function pause() {
    if (_state === STATE.RUNNING) _setState(STATE.PAUSED);
}

function resume() {
    if (_state === STATE.PAUSED) _setState(STATE.RUNNING);
}

function stop() {
    if (_state === STATE.IDLE || _state === STATE.STOPPED) return;
    _setState(STATE.STOPPED);
    if (_thread) {
        try { _thread.interrupt(); } catch (e) {}
    }
}

function lastError() { return _lastError; }

function _runLoop() {
    try {
        const cfg = Storage.loadConfig();
        if (!cfg.sourceGroup) throw new Error("未设置源群名称");
        if (!cfg.targetGroups || cfg.targetGroups.length === 0) {
            throw new Error("未设置目标群（至少一个）");
        }

        _emitProgress(Storage.getTodayCount(), cfg.dailyLimit);

        if (Anti.isQuietNow(cfg)) {
            _log("当前在凌晨保护时段，不运行");
            _setState(STATE.IDLE);
            return;
        }

        for (let i = 0; i < cfg.targetGroups.length; i++) {
            if (_state === STATE.STOPPED) { _log("已停止"); break; }
            while (_state === STATE.PAUSED) sleep(500);
            if (_state === STATE.STOPPED) break;

            if (Storage.getTodayCount() >= cfg.dailyLimit) {
                _log("今日上限达成，自动停止");
                break;
            }
            if (Anti.isQuietNow(cfg)) {
                _log("进入凌晨保护时段，停止");
                break;
            }

            const target = cfg.targetGroups[i];
            _log("=== 目标群 " + (i + 1) + "/" + cfg.targetGroups.length + ": " + target + " ===");

            try {
                _runOneTarget(cfg, target);
            } catch (e) {
                _lastError = e;
                _log("处理目标群失败: " + e.message);
                try { Nav.backToSourceGroup(cfg, _log); } catch (ee) {}
            }

            if (_state === STATE.STOPPED) break;
            if (Storage.getTodayCount() >= cfg.dailyLimit) {
                _log("今日上限达成，自动停止");
                break;
            }

            const cooldown = Anti.batchCooldown(cfg);
            _log("批次冷却 " + Math.round(cooldown / 1000) + " 秒");
            const startWait = Date.now();
            while (Date.now() - startWait < cooldown) {
                if (_state === STATE.STOPPED) break;
                while (_state === STATE.PAUSED) sleep(500);
                sleep(500);
            }
        }

        _log("本轮结束");
        _setState(STATE.IDLE);
    } catch (e) {
        _lastError = e;
        _log("运行错误: " + (e && e.message ? e.message : e));
        _setState(STATE.IDLE);
    }
}

function _runOneTarget(cfg, target) {
    Nav.gotoSourceGroup(cfg, _log);
    Nav.openInvitePage(cfg, _log);
    Nav.collapseCreatedGroups(cfg, _log);
    Nav.expandJoinedGroups(cfg, _log);
    Nav.findAndEnterTarget(target, cfg, _log);

    const remaining = cfg.dailyLimit - Storage.getTodayCount();
    if (remaining <= 0) return;

    const checked = Select.checkBatch(cfg, remaining, _log);
    if (checked === 0) {
        _log("一个都没勾选到，跳过");
        Nav.backToSourceGroup(cfg, _log);
        return;
    }

    Select.submitInvite(cfg, _log);
    const newTotal = Storage.addTodayCount(checked);
    _emitProgress(newTotal, cfg.dailyLimit);
    _log("本批完成 +" + checked + "，今日累计 " + newTotal + "/" + cfg.dailyLimit);

    Anti.maybeJitter(cfg);
    Nav.backToSourceGroup(cfg, _log);
}

module.exports = {
    STATE: STATE,
    getState: getState,
    setFloating: setFloating,
    setOnStateChange: setOnStateChange,
    start: start,
    pause: pause,
    resume: resume,
    stop: stop,
    lastError: lastError,
};
