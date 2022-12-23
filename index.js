"use strict";
var _a;
const $x = document.querySelector("input[name=x]");
const $y = document.querySelector("input[name=y]");
const $z = document.querySelector("input[name=z]");
const $canvas = document.getElementById("graph");
const graphCtx = $canvas.getContext("2d");
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
function magnitudeToHeight(m) {
    return (m / 5) * height;
}
function onMotionData(g) {
    const m = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
    buffered.unshift(m);
    if (buffered.length == width) {
        delete buffered[width];
    }
    graphCtx.clearRect(0, 0, width, height);
    graphCtx.moveTo(0, 0);
    graphCtx.lineWidth = 2;
    graphCtx.font = "sans-serif";
    const start = magnitudeToHeight(m);
    graphCtx.fillText("✈️", 10, start);
    graphCtx.beginPath();
    graphCtx.moveTo(10, start);
    for (let i = 0; i < buffered.length; ++i) {
        graphCtx.lineTo(10 + i, magnitudeToHeight(buffered[i]));
        //graphCtx.fillRect(i, magnitudeToHeight(buffered[i]), 2, 2);
    }
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
