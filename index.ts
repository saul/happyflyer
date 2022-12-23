const $x = document.querySelector("input[name=x]")! as HTMLInputElement;
const $y = document.querySelector("input[name=y]")! as HTMLInputElement;
const $z = document.querySelector("input[name=z]")! as HTMLInputElement;
const $canvas = document.getElementById("graph")! as HTMLCanvasElement;
const graphCtx = $canvas.getContext("2d")!;

const GRAV = 9.80665;
const width = 512;
const height = 512;
$canvas.width = width * window.devicePixelRatio;
$canvas.height = height * window.devicePixelRatio;
$canvas.style.width = width + "px";
$canvas.style.height = height + "px";
graphCtx?.scale(window.devicePixelRatio, window.devicePixelRatio);

interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

let buffered: number[] = [];

interface IOSDeviceMotionEvent {
  requestPermission?: () => Promise<string>;
}

document.querySelector("#start")?.addEventListener("click", (e) => {
  const dme: IOSDeviceMotionEvent =
    DeviceMotionEvent as unknown as IOSDeviceMotionEvent;

  if (typeof dme.requestPermission === "function") {
    dme
      .requestPermission()
      .then((permissionState) => {
        if (permissionState === "granted") {
          window.addEventListener("devicemotion", onMotion);
        } else {
          console.error(
            `Unexpected device motion permission: ${permissionState}`
          );
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener("devicemotion", onMotion);
  }
});

function magnitudeToHeight(m: number): number {
  return (m / 5) * height;
}

function onMotionData(g: Vector3) {
  const m = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) / GRAV;
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

function onMotion(event: DeviceMotionEvent) {
  const g = event.accelerationIncludingGravity;
  if (!g) return;
  onMotionData(g as Vector3);
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
