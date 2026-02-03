const container = document.getElementById("progress-container");
const mainWindow = document.getElementById("main-container");
const bar = document.getElementById("progress-bar");
const closeBtnContainer = document.getElementById("close-btn-container");
const closeBtn = document.getElementById("close-btn");
let use24Hour = true;


mainWindow.addEventListener("mouseenter", () => {
  closeBtnContainer.style.display = "block";
});

mainWindow.addEventListener("mouseleave", () => {
  closeBtnContainer.style.display = "none";
});

closeBtn.addEventListener("click", () => {
  window.close();
});

window.updater.onProgress((data) => {
  container.style.display = "block";
  bar.style.width = `${data.percent}%`;
});

window.updater.onComplete(() => {
  setTimeout(() => {
    container.style.display = "none";
  }, 500);
});


function updateClock() {
  const now = new Date();

  let hours = now.getHours();
  let suffix = "";

  if (!use24Hour) {
    suffix = hours >= 12 ? " PM" : " AM";
    hours = hours % 12 || 12;
  }

  const h = String(hours).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  document.getElementById("time-main").textContent = `${h}:${m}`;
  document.getElementById("time-sec").textContent = `:${s}${suffix}`;
}

window.clockSettings.getFormat().then((value) => {
  use24Hour = value;
  updateClock();
});

window.clockSettings.onFormatChange((value) => {
  use24Hour = value;
  updateClock();
});

setInterval(updateClock, 1000);
updateClock();
