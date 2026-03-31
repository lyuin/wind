const $ = (id) => document.getElementById(id);

const DIRS_JA = [
  "北", "北北東", "北東", "東北東",
  "東", "東南東", "南東", "南南東",
  "南", "南南西", "南西", "西南西",
  "西", "西北西", "北西", "北北西",
];

const UPDATE_INTERVAL = 10_000;

let wakeLock = null;

// --- Wake Lock (API + iOS動画フォールバック) ---
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch { /* unsupported or denied */ }
  startNoSleepVideo();
}

function startNoSleepVideo() {
  if (document.getElementById("nosleep")) return;
  const video = document.createElement("video");
  video.id = "nosleep";
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.muted = true;
  video.loop = true;
  video.style.cssText = "position:fixed;opacity:0;width:1px;height:1px;pointer-events:none;";
  // 無音の極小mp4 (base64)
  video.src = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAACttZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MAAAABhzdHRzAAAAAAAAAAEAAAABAAAEAAAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAKHN0c3oAAAAAAAAAAAAAAAIAAAK1AAAACwAAABRzdGNvAAAAAAAAAAEAAAAwAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY2MC4xNi4xMDA=";
  document.body.appendChild(video);
  video.play().catch(() => {});
  // iOS: ユーザー操作後に再生開始
  document.addEventListener("touchstart", () => video.play().catch(() => {}), { once: true });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") requestWakeLock();
});

// --- 風向 → 日本語ラベル ---
function degToLabel(deg) {
  const i = Math.round(deg / 22.5) % 16;
  return DIRS_JA[i];
}

// --- API ---
async function fetchWind(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return {
    speed: data.current.wind_speed_10m,
    direction: data.current.wind_direction_10m,
  };
}

let currentRotation = 0;

// --- 表示更新 ---
function render(speed, direction) {
  const target = (direction + 180) % 360;
  // 最短回転: 差分を -180〜180 に収める
  let delta = target - (currentRotation % 360);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  currentRotation += delta;
  $("arrow").style.transform = `rotate(${currentRotation}deg)`;
  $("speed").textContent = speed.toFixed(1);
  $("direction-label").textContent = degToLabel(direction);
}

function showLoading() {
  $("arrow").classList.add("loading");
  $("arrow").style.transform = "rotate(0deg)";
  $("speed").style.visibility = "hidden";
  $("unit").style.visibility = "hidden";
  $("direction-label").style.visibility = "hidden";
  $("error").classList.add("hidden");
}

function showMain() {
  $("arrow").classList.remove("loading");
  $("speed").style.visibility = "visible";
  $("unit").style.visibility = "visible";
  $("direction-label").style.visibility = "visible";
  $("error").classList.add("hidden");
}

function showError(msg) {
  $("arrow").classList.add("loading");
  $("error").classList.remove("hidden");
  $("error").textContent = msg;
}

function showOffline() {
  $("arrow").classList.add("loading");
  $("speed").style.visibility = "hidden";
  $("unit").style.visibility = "hidden";
  $("direction-label").style.visibility = "hidden";
  $("arrow").style.transform = "rotate(0deg)";
}

// --- メインループ ---
let intervalId = null;

async function update() {
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: UPDATE_INTERVAL,
      })
    );
    const { latitude, longitude } = pos.coords;
    const wind = await fetchWind(latitude, longitude);
    render(wind.speed, wind.direction);
    showMain();
  } catch (e) {
    showLoading();
  }
}

async function init() {
  showLoading();
  await requestWakeLock();

  if (!navigator.geolocation) {
    showError("位置情報に対応していません");
    return;
  }

  await update();
  intervalId = setInterval(update, UPDATE_INTERVAL);
}

// Service Worker 登録
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

init();
