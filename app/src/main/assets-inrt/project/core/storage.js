const STORE_NAME = "qq_invite_v1";
const store = storages.create(STORE_NAME);

const DEFAULTS = {
    sourceGroup: "",
    targetGroups: [],
    batchSize: 10,
    batchIntervalMin: 5,
    batchIntervalMax: 10,
    dailyLimit: 25,
    actionDelayMin: 1.5,
    actionDelayMax: 3.0,
    quietHours: true,
    quietStart: 0,
    quietEnd: 7,
};

function loadConfig() {
    const cfg = {};
    Object.keys(DEFAULTS).forEach(function (k) {
        cfg[k] = store.get(k, DEFAULTS[k]);
    });
    return cfg;
}

function saveConfig(cfg) {
    Object.keys(DEFAULTS).forEach(function (k) {
        if (cfg[k] !== undefined) store.put(k, cfg[k]);
    });
}

function todayKey() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return "count_" + d.getFullYear() + "-" + m + "-" + day;
}

function getTodayCount() {
    return store.get(todayKey(), 0);
}

function addTodayCount(n) {
    const k = todayKey();
    const cur = store.get(k, 0);
    store.put(k, cur + n);
    return cur + n;
}

function resetToday() {
    store.put(todayKey(), 0);
}

function pushLog(line) {
    const logs = store.get("logs", []);
    logs.push({ ts: Date.now(), line: line });
    while (logs.length > 500) logs.shift();
    store.put("logs", logs);
}

function getLogs() {
    return store.get("logs", []);
}

module.exports = {
    DEFAULTS: DEFAULTS,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    getTodayCount: getTodayCount,
    addTodayCount: addTodayCount,
    resetToday: resetToday,
    pushLog: pushLog,
    getLogs: getLogs,
};
