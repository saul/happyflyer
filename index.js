"use strict";
const $startBtn = document.querySelector("#start");
const $imageTop = document.querySelector("#img-top");
const $imageSide = document.querySelector("#img-side");
const $imageFront = document.querySelector("#img-front");
const $planePitch = document.querySelector("#plane-pitch");
const $planePitchText = document.querySelector("#plane-pitch-text");
const $planeRoll = document.querySelector("#plane-roll");
const $planeRollText = document.querySelector("#plane-roll-text");
const GRAV = 9.80665;
const $canvas = document.getElementById("graph");
const graphCtx = $canvas.getContext("2d");
const graphWidth = 512;
const graphHeight = 512;
setupDpiNativeCanvas($canvas, graphCtx, graphWidth, graphHeight);
const $canvasPitch = document.getElementById("canvas-pitch");
const pitchCtx = $canvasPitch.getContext("2d");
setupDpiNativeCanvas($canvasPitch, pitchCtx, $canvasPitch.clientWidth, $canvasPitch.clientHeight);
const $canvasRoll = document.getElementById("canvas-roll");
const rollCtx = $canvasRoll.getContext("2d");
setupDpiNativeCanvas($canvasRoll, rollCtx, $canvasRoll.clientWidth, $canvasRoll.clientHeight);
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
                window.addEventListener("deviceorientation", onOrientation);
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
        $startBtn.remove();
    }
});
function setupDpiNativeCanvas(canvas, context, width, height) {
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
}
const GRAPH_BORDER_WIDTH = 2;
const GRAPH_BORDER_STYLE = "rgba(0, 0, 0, 1.0)";
const GRIDLINE_LINE_STYLE = "rgba(0, 0, 0, 0.3)";
const GRIDLINE_LINE_WIDTH = 1;
const MAX_HEIGHT_G = 5;
const MARGIN = 20;
const TEXT_HEIGHT = 20;
function magnitudeToHeight(m) {
    return (MARGIN +
        (graphHeight - 2 * MARGIN) -
        (m / MAX_HEIGHT_G) * (graphHeight - 2 * MARGIN));
}
function drawGridlines() {
    // Graph colour fill
    graphCtx.fillStyle = "rgba(46, 204, 113, 0.2)";
    graphCtx.fillRect(MARGIN, magnitudeToHeight(2.5), graphWidth, magnitudeToHeight(0) - magnitudeToHeight(2.5));
    graphCtx.fillStyle = "rgba(230, 126, 34, 0.2)";
    graphCtx.fillRect(MARGIN, magnitudeToHeight(MAX_HEIGHT_G), graphWidth, magnitudeToHeight(2.5) - magnitudeToHeight(MAX_HEIGHT_G));
    // Horizontal axis gridlines
    const size = 14;
    graphCtx.font = `${size}px sans-serif`;
    graphCtx.fillStyle = GRIDLINE_LINE_STYLE;
    for (let i = 0; i <= MAX_HEIGHT_G; ++i) {
        let y = magnitudeToHeight(i);
        graphCtx.fillText(i.toString(), MARGIN - size, y + size * 1.2);
        graphCtx.beginPath();
        if (i == 0) {
            graphCtx.lineWidth = GRAPH_BORDER_WIDTH;
            graphCtx.strokeStyle = GRAPH_BORDER_STYLE;
        }
        else {
            graphCtx.lineWidth = GRIDLINE_LINE_WIDTH;
            graphCtx.strokeStyle = GRIDLINE_LINE_STYLE;
        }
        graphCtx.moveTo(0, y);
        graphCtx.lineTo(graphWidth, y);
        graphCtx.closePath();
        graphCtx.stroke();
    }
    // Vertical axis
    graphCtx.beginPath();
    graphCtx.lineWidth = GRAPH_BORDER_WIDTH;
    graphCtx.strokeStyle = GRAPH_BORDER_STYLE;
    graphCtx.moveTo(MARGIN, 0);
    graphCtx.lineTo(MARGIN, graphHeight);
    graphCtx.closePath();
    graphCtx.stroke();
}
function onMotionData(g) {
    const m = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) / GRAV;
    buffered.unshift(m);
    if (buffered.length == graphWidth) {
        delete buffered[graphWidth];
    }
    graphCtx.clearRect(0, 0, graphWidth, graphHeight);
    drawGridlines();
    const start = magnitudeToHeight(m);
    graphCtx.beginPath();
    graphCtx.lineWidth = 3;
    graphCtx.strokeStyle = "#27ae60";
    graphCtx.moveTo(MARGIN, start);
    for (let i = 0; i < buffered.length; ++i) {
        graphCtx.lineTo(MARGIN + i, magnitudeToHeight(buffered[i]));
    }
    graphCtx.stroke();
    graphCtx.drawImage($imageSide, MARGIN, start - 15, 60, 60 * ($imageSide.height / $imageSide.width));
    graphCtx.font = `${TEXT_HEIGHT}px sans-serif`;
    graphCtx.fillStyle = "#27ae60";
    // Round to closest 2dp
    const mRounded = Math.round(m * 100) / 100;
    graphCtx.fillText(`${mRounded.toFixed(2)}`, MARGIN + 5, start - TEXT_HEIGHT / 2);
}
function onMotion(event) {
    const g = event.accelerationIncludingGravity;
    if (!g)
        return;
    onMotionData(g);
}
let lastRawRoll = 0;
let lastRawPitch = 0;
let pitchBias = 0;
let displayCalibratedPitch = true;
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
function updateOrientation(pitch, roll) {
    // Remove pitch bias if we want to show calibrated
    if (displayCalibratedPitch) {
        pitch -= pitchBias;
        $planePitchText.classList.add("calibrated");
    }
    else {
        $planePitchText.classList.remove("calibrated");
    }
    pitchCtx.clearRect(0, 0, $canvasPitch.width, $canvasPitch.height);
    rollCtx.clearRect(0, 0, $canvasRoll.width, $canvasRoll.height);
    if (Math.abs(pitch) > 30 || Math.abs(roll) > 40) {
        $planeRoll.style.transform = "";
        $planeRollText.textContent = `Place flat`;
        $planePitch.style.transform = "";
        $planePitchText.textContent = `Place flat`;
    }
    else {
        $planeRoll.style.transform = `rotate(${-roll}deg)`;
        $planeRollText.textContent = `${roll | 0}º`;
        $planePitch.style.transform = `rotate(${pitch}deg)`;
        $planePitchText.textContent =
            (displayCalibratedPitch ? "" : "(raw)\n") + `${pitch | 0}º`;
        pitchCtx.beginPath();
        pitchCtx.fillStyle = "#ddd";
        pitchCtx.moveTo($canvasPitch.clientWidth / 2, $canvasPitch.clientHeight / 2);
        pitchCtx.arc($canvasPitch.clientWidth / 2, $canvasPitch.clientHeight / 2, $canvasPitch.clientWidth / 2, deg2rad(180), deg2rad(180 + pitch), pitch < 0);
        pitchCtx.closePath();
        pitchCtx.fill();
        rollCtx.beginPath();
        rollCtx.fillStyle = "#ddd";
        rollCtx.moveTo($canvasRoll.clientWidth / 2, $canvasRoll.clientHeight / 2);
        rollCtx.arc($canvasRoll.clientWidth / 2, $canvasRoll.clientHeight / 2, $canvasRoll.clientWidth / 2, deg2rad(180), deg2rad(180 - roll), roll > 0);
        rollCtx.closePath();
        rollCtx.fill();
        rollCtx.beginPath();
        rollCtx.fillStyle = "#ddd";
        rollCtx.moveTo($canvasRoll.clientWidth / 2, $canvasRoll.clientHeight / 2);
        rollCtx.arc($canvasRoll.clientWidth / 2, $canvasRoll.clientHeight / 2, $canvasRoll.clientWidth / 2, 0, deg2rad(-roll), roll > 0);
        rollCtx.closePath();
        rollCtx.fill();
    }
    drawMidline(rollCtx, $canvasRoll.clientWidth, $canvasRoll.clientHeight);
    drawMidline(pitchCtx, $canvasPitch.clientWidth, $canvasPitch.clientHeight);
}
function drawMidline(context, width, height) {
    context.beginPath();
    context.strokeStyle = "#aaa";
    context.setLineDash([5, 5]);
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.closePath();
    context.stroke();
}
function onOrientation(event) {
    const roll = event.gamma; // -90 to 90
    const pitch = event.beta; // -180 to 180
    lastRawRoll = roll;
    lastRawPitch = pitch;
    updateOrientation(pitch, roll);
}
$planePitch.addEventListener("click", () => {
    pitchBias = lastRawPitch;
    displayCalibratedPitch = true;
    updateOrientation(lastRawPitch, lastRawRoll);
});
$planePitchText.addEventListener("click", () => {
    displayCalibratedPitch = !displayCalibratedPitch;
    updateOrientation(lastRawPitch, lastRawRoll);
});
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
    window.addEventListener("deviceorientation", onOrientation);
    $startBtn.remove();
}
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
}
