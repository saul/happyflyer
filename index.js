"use strict";
const $startBtn = document.querySelector("#start");
const $canvas = document.getElementById("graph");
const graphCtx = $canvas.getContext("2d");
const $imageTop = document.querySelector("#img-top");
const $imageSide = document.querySelector("#img-side");
const $imageFront = document.querySelector("#img-front");
const GRAV = 9.80665;
const width = 512;
const height = 512;
$canvas.width = width * window.devicePixelRatio;
$canvas.height = height * window.devicePixelRatio;
$canvas.style.width = width + "px";
$canvas.style.height = height + "px";
graphCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
let buffered = [];
$startBtn.addEventListener("click", (e) => {
    const dme = DeviceMotionEvent;
    const doe = DeviceOrientationEvent;
    if (typeof dme.requestPermission === "function" &&
        typeof doe.requestPermission === "function") {
        dme
            .requestPermission()
            .then((permissionState) => {
            console.log(`DeviceMotionEvent: ${permissionState}`);
            if (permissionState === "granted") {
                window.addEventListener("devicemotion", onMotion);
                $startBtn.remove();
            }
            else {
                console.error(`Unexpected device motion permission: ${permissionState}`);
            }
        })
            .catch(console.error);
        doe
            .requestPermission()
            .then((permissionState) => {
            console.log(`DeviceOrientationEvent: ${permissionState}`);
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
const MARGIN = 20;
const TEXT_HEIGHT = 20;
function magnitudeToHeight(m) {
    return (MARGIN + (height - 2 * MARGIN) - (m / MAX_HEIGHT_G) * (height - 2 * MARGIN));
}
function drawGridlines() {
    const size = 14;
    graphCtx.font = `${size}px sans-serif`;
    graphCtx.fillStyle = GRIDLINE_LINE_STYLE;
    // Horizontal axis gridlines
    for (let i = 0; i <= MAX_HEIGHT_G; ++i) {
        let y = magnitudeToHeight(i);
        graphCtx.fillText(i.toString(), MARGIN - size, y + size * 1.2);
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
    drawGridlines();
    const start = magnitudeToHeight(m);
    graphCtx.beginPath();
    graphCtx.moveTo(MARGIN, start);
    for (let i = 0; i < buffered.length; ++i) {
        graphCtx.lineTo(MARGIN + i, magnitudeToHeight(buffered[i]));
    }
    graphCtx.lineWidth = 3;
    graphCtx.strokeStyle = "#27ae60";
    graphCtx.stroke();
    graphCtx.font = `${TEXT_HEIGHT}px sans-serif`;
    graphCtx.fillStyle = "#27ae60";
    //graphCtx.fillText("✈️", MARGIN, start + TEXT_HEIGHT / 2);
    graphCtx.drawImage($imageSide, MARGIN, start - 15, 60, 60 * ($imageSide.height / $imageSide.width));
    graphCtx.fillText(`${m.toFixed(2)}`, MARGIN + 5, start - TEXT_HEIGHT / 2);
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
            y: Math.cos(time) * 1 + 5 + Math.random() / 50,
            z: Math.sin(time) * 2 + GRAV + Math.random() / 50,
        });
        window.requestAnimationFrame(onFrame);
    }
    window.requestAnimationFrame(onFrame);
    $startBtn.remove();
}
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
}
