function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function actionDelay(cfg) {
    const ms = randFloat(cfg.actionDelayMin, cfg.actionDelayMax) * 1000;
    sleep(ms);
}

function batchCooldown(cfg) {
    const min = randFloat(cfg.batchIntervalMin, cfg.batchIntervalMax) * 60 * 1000;
    return min;
}

function isQuietNow(cfg) {
    if (!cfg.quietHours) return false;
    const h = new Date().getHours();
    const start = cfg.quietStart;
    const end = cfg.quietEnd;
    if (start <= end) return h >= start && h < end;
    return h >= start || h < end;
}

function maybeJitter(cfg) {
    if (Math.random() < 0.05) {
        const dir = Math.random() < 0.5 ? "up" : "down";
        const w = device.width || 1080;
        const h = device.height || 1920;
        if (dir === "up") {
            swipe(w / 2, h * 0.7, w / 2, h * 0.4, 400);
        } else {
            swipe(w / 2, h * 0.4, w / 2, h * 0.7, 400);
        }
        sleep(randInt(500, 1500));
    }
}

module.exports = {
    randInt: randInt,
    randFloat: randFloat,
    actionDelay: actionDelay,
    batchCooldown: batchCooldown,
    isQuietNow: isQuietNow,
    maybeJitter: maybeJitter,
};
