const Engine = require("../core/engine.js");

let _win = null;

function show(opts) {
    opts = opts || {};
    if (_win) return _win;

    if (!floaty.checkPermission()) {
        toast("缺少悬浮窗权限");
        return null;
    }

    _win = floaty.window(
        <frame>
            <vertical bg="#cc1f2937" padding="6 4" w="auto">
                <horizontal gravity="center_vertical">
                    <text id="dot" text="●" textColor="#10b981" textSize="14sp" margin="0 4 0 0" />
                    <text id="status" text="待机" textColor="#ffffff" textSize="13sp" margin="0 6 0 0" />
                    <text id="progress" text="0/0" textColor="#ffd166" textSize="12sp" margin="0 6 0 0" />
                </horizontal>
                <horizontal gravity="center" margin="0 4 0 0">
                    <button id="btnPlay" text="▶" textSize="12sp" w="36" h="32" margin="2" />
                    <button id="btnStop" text="■" textSize="12sp" w="36" h="32" margin="2" />
                    <button id="btnSettings" text="⚙" textSize="12sp" w="36" h="32" margin="2" />
                </horizontal>
            </vertical>
        </frame>
    );

    _win.setPosition(40, 200);
    try { _win.setTouchable(true); } catch (e) {}

    _setupDrag();

    _win.btnPlay.click(function () {
        const s = Engine.getState();
        if (s === Engine.STATE.RUNNING) {
            Engine.pause();
        } else if (s === Engine.STATE.PAUSED) {
            Engine.resume();
        } else {
            Engine.start();
        }
    });

    _win.btnStop.click(function () {
        Engine.stop();
    });

    _win.btnSettings.click(function () {
        if (opts.onSettings) opts.onSettings();
    });

    Engine.setFloating({
        onState: function (s) { _renderState(s); },
        onProgress: function (n, lim) { _renderProgress(n, lim); },
        onLog: function (msg) {},
    });

    _renderState(Engine.getState());
    return _win;
}

function _setupDrag() {
    let downX = 0, downY = 0, winX = 0, winY = 0;
    _win.status.setOnTouchListener(function (view, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                downX = event.getRawX();
                downY = event.getRawY();
                winX = _win.getX();
                winY = _win.getY();
                return true;
            case event.ACTION_MOVE:
                _win.setPosition(winX + (event.getRawX() - downX), winY + (event.getRawY() - downY));
                return true;
        }
        return true;
    });
}

function _renderState(s) {
    if (!_win) return;
    ui.run(function () {
        switch (s) {
            case "RUNNING":
                _win.dot.setTextColor(colors.parseColor("#10b981"));
                _win.status.setText("运行中");
                _win.btnPlay.setText("‖");
                break;
            case "PAUSED":
                _win.dot.setTextColor(colors.parseColor("#f59e0b"));
                _win.status.setText("已暂停");
                _win.btnPlay.setText("▶");
                break;
            case "STOPPED":
                _win.dot.setTextColor(colors.parseColor("#ef4444"));
                _win.status.setText("已停止");
                _win.btnPlay.setText("▶");
                break;
            default:
                _win.dot.setTextColor(colors.parseColor("#94a3b8"));
                _win.status.setText("待机");
                _win.btnPlay.setText("▶");
        }
    });
}

function _renderProgress(n, lim) {
    if (!_win) return;
    ui.run(function () {
        _win.progress.setText(n + "/" + lim);
    });
}

function close() {
    if (_win) {
        try { _win.close(); } catch (e) {}
        _win = null;
    }
}

module.exports = {
    show: show,
    close: close,
};
