"use strict";
var _a;
const $x = document.querySelector("input[name=x]");
const $y = document.querySelector("input[name=y]");
const $z = document.querySelector("input[name=z]");
const $canvas = document.getElementById("graph");
const graphCtx = $canvas.getContext("2d");
const GRAV = 9.80665;
const width = 512;
const height = 512;
$canvas.width = width * window.devicePixelRatio;
$canvas.height = height * window.devicePixelRatio;
$canvas.style.width = width + "px";
$canvas.style.height = height + "px";
graphCtx === null || graphCtx === void 0 ? void 0 : graphCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
let buffered = [];
(_a = document.querySelector("#start")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (e) => {
    const dme = DeviceMotionEvent;
    if (typeof dme.requestPermission === "function") {
        dme
            .requestPermission()
            .then((permissionState) => {
            if (permissionState === "granted") {
                window.addEventListener("devicemotion", onMotion);
            }
            else {
                console.error(`Unexpected device motion permission: ${permissionState}`);
            }
        })
            .catch(console.error);
    }
    else {
        window.addEventListener("devicemotion", onMotion);
    }
});
const GRAPH_BORDER_WIDTH = 2;
const GRAPH_BORDER_STYLE = "#000";
const GRIDLINE_LINE_STYLE = "#aaa";
const GRIDLINE_LINE_WIDTH = 1;
const MAX_HEIGHT_G = 6;
const MARGIN = 10;
function magnitudeToHeight(m) {
    return (MARGIN + (height - 2 * MARGIN) - (m / MAX_HEIGHT_G) * (height - 2 * MARGIN));
}
function drawGridlines() {
    // Horizontal axis gridlines
    for (let i = 0; i <= MAX_HEIGHT_G; ++i) {
        let y = magnitudeToHeight(i);
        graphCtx.beginPath();
        graphCtx.moveTo(0, y);
        graphCtx.lineTo(width, y);
        if (i == 0) {
            graphCtx.lineWidth = GRAPH_BORDER_WIDTH;
            graphCtx.strokeStyle = GRAPH_BORDER_STYLE;
        }
        else {
            graphCtx.lineWidth = GRIDLINE_LINE_WIDTH;
            graphCtx.strokeStyle = GRIDLINE_LINE_STYLE;
        }
        graphCtx.stroke();
    }
    // Vertical axis
    graphCtx.beginPath();
    graphCtx.moveTo(MARGIN, 0);
    graphCtx.lineTo(MARGIN, height);
    graphCtx.lineWidth = GRAPH_BORDER_WIDTH;
    graphCtx.strokeStyle = GRAPH_BORDER_STYLE;
    graphCtx.stroke();
}
function onMotionData(g) {
    const m = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) / GRAV;
    buffered.unshift(m);
    if (buffered.length == width) {
        delete buffered[width];
    }
    graphCtx.clearRect(0, 0, width, height);
    graphCtx.font = "sans-serif";
    drawGridlines();
    const start = magnitudeToHeight(m);
    graphCtx.fillText("✈️", MARGIN, start);
    graphCtx.fillText(`${Math.round(m * 100) / 100}`, MARGIN, start - 10);
    graphCtx.beginPath();
    graphCtx.moveTo(MARGIN, start);
    for (let i = 0; i < buffered.length; ++i) {
        graphCtx.lineTo(MARGIN + i, magnitudeToHeight(buffered[i]));
        //graphCtx.fillRect(i, magnitudeToHeight(buffered[i]), 2, 2);
    }
    graphCtx.lineWidth = 3;
    graphCtx.strokeStyle = "#000";
    graphCtx.stroke();
    $x.value = `${g.x}`;
    $y.value = `${g.y}`;
    $z.value = `${g.z}`;
}
function onMotion(event) {
    const g = event.accelerationIncludingGravity;
    if (!g)
        return;
    onMotionData(g);
}
// In non-secure contexts we can't get motion data
if (window.location.protocol === "http:") {
    function onFrame() {
        const time = performance.now() / 1000;
        onMotionData({
            x: Math.sin(time) * 1 + 1 + Math.random() / 50,
            y: Math.cos(time) * 1 + 1 + Math.random() / 50,
            z: Math.sin(time) * 3 + 1 + Math.random() / 50,
        });
        window.requestAnimationFrame(onFrame);
    }
    window.requestAnimationFrame(onFrame);
}
