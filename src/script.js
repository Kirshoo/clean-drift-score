let impact_counter = 0;
let total_drift_points = 0;

let previous_total = 0;

function log(...m) {
    console.info("[CRASH EXT]", ...m);
}

function has_crashed(data) {
    if (impact_counter === data.events.impacts)
        return false;

    if (impact_counter > data.events.impacts) {
        log("Impact counter invalid: registered more impacts than the game.");
        impact_counter = data.events.impacts;
        return false;
    }

    impact_counter = data.events.impacts;
    return true;
}

function is_in_race(data) {
    return data.race.kind !== "none";
}

function handle_crash(data) {
    if (!has_crashed(data))
        return;

    log("Driver crashed on frame", data.frame);
    reset_total_points();
}

function update_total_points(data) {
    if (data.race.driftPending > 0)
        return;

    if (previous_total === data.race.driftScore)
        return;

    if (data.race.driftScore === 0) {
        log("Total drift score reset.");
        previous_total = 0;
    }

    let score_delta = data.race.driftScore - previous_total;
    console.debug("New total score:", data.race.driftScore);
    total_drift_points += score_delta;

    log(`Score delta on frame ${data.frame}:`, score_delta);
    
    previous_total = data.race.driftScore;
}

function reset_total_points() {
    total_drift_points = 0;
}

function set_total_points(target, new_total) {
    if (!target) return;

    const value = String(new_total);

    if (target.textContent !== value) {
        target.textContent = value;
    }
}

function handle_car(data) {
    if (is_in_race(data))
        return;

    update_total_points(data);

    handle_crash(data);
}

function subscribe() {
    window.postMessage({ nfsu2: 'car-on' }, location.origin);
}

function unsubscribe() {
    window.postMessage({ nfsu2: 'car-off' }, location.origin);
}

function create_cleanrun_score_tab(panel) {
    if (!panel) {
        log("Unable to find drift panel, aborting!");
        unsubscribe();
        return;
    }

    const score_tab = document.createElement('div');
    score_tab.id = "cleanrun-score";

    const score_tab_title = document.createElement('span');
    score_tab_title.textContent = "Clean Drift Score";

    const score_tab_points = document.createElement('b');
    score_tab_points.textContent = String(total_drift_points);

    score_tab.appendChild(score_tab_title);
    score_tab.appendChild(score_tab_points);

    panel.insertBefore(score_tab, panel.children[2]);

    return document.querySelector("#cleanrun-score b");
}

function wait_for_element(selector, callback) {
    const exisitng = document.querySelector(selector);

    if (exisitng) {
        callback(exisitng);
        return;
    }

    const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);

        if (element) {
            observer.disconnect();
            callback(element);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

let points_span = undefined;

// Attach event listener to the window
window.addEventListener('message', e => {
    if (e.source !== window || !e.data) return;
    const m = e.data;

    if (m.nfsu2 === 'feed-ready') {
        log("Feed updated");
    }

    if (m.nfsu2 === "car") {
        handle_car(m);
        set_total_points(points_span, total_drift_points);
    }
});

wait_for_element(".drift-panel", (panel) => {
    log("Drift panel found!");

    let existing = document.querySelector("#cleanrun-score b");
    if (!existing)
        points_span = create_cleanrun_score_tab(panel);
    else
        points_span = existing;

    subscribe();
});