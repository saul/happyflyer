"use strict";
const $startBtn = document.querySelector("#start");
const $canvas = document.getElementById("graph");
const graphCtx = $canvas.getContext("2d");
const $imageTop = document.querySelector("#img-top");
const $imageSide = document.querySelector("#img-side");
const $imageFront = document.querySelector("#img-front");
const $planePitch = document.querySelector("#plane-pitch");
const $planePitchText = document.querySelector("#plane-pitch-text");
const $planeRoll = document.querySelector("#plane-roll");
const $planeRollText = document.querySelector("#plane-roll-text");
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
const GRAPH_BORDER_WIDTH = 2;
const GRAPH_BORDER_STYLE = "rgba(0, 0, 0, 1.0)";
const GRIDLINE_LINE_STYLE = "rgba(0, 0, 0, 0.3)";
const GRIDLINE_LINE_WIDTH = 1;
const MAX_HEIGHT_G = 5;
const MARGIN = 20;
const TEXT_HEIGHT = 20;
function magnitudeToHeight(m) {
    return (MARGIN + (height - 2 * MARGIN) - (m / MAX_HEIGHT_G) * (height - 2 * MARGIN));
}
function drawGridlines() {
    // Graph colour fill
    graphCtx.fillStyle = "rgba(46, 204, 113, 0.2)";
    graphCtx.fillRect(MARGIN, magnitudeToHeight(2.5), width, magnitudeToHeight(0) - magnitudeToHeight(2.5));
    graphCtx.fillStyle = "rgba(230, 126, 34, 0.2)";
    graphCtx.fillRect(MARGIN, magnitudeToHeight(MAX_HEIGHT_G), width, magnitudeToHeight(2.5) - magnitudeToHeight(MAX_HEIGHT_G));
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
        graphCtx.lineTo(width, y);
        graphCtx.closePath();
        graphCtx.stroke();
    }
    // Vertical axis
    graphCtx.beginPath();
    graphCtx.lineWidth = GRAPH_BORDER_WIDTH;
    graphCtx.strokeStyle = GRAPH_BORDER_STYLE;
    graphCtx.moveTo(MARGIN, 0);
    graphCtx.lineTo(MARGIN, height);
    graphCtx.closePath();
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
function updateOrientation(pitch, roll) {
    // Remove pitch bias if we want to show calibrated
    if (displayCalibratedPitch) {
        pitch -= pitchBias;
        $planePitchText.classList.add("calibrated");
    }
    else {
        $planePitchText.classList.remove("calibrated");
    }
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
    }
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
