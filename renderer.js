const container = document.getElementById("progress-container");
const mainWindow = document.getElementById("main-container");
const bar = document.getElementById("progress-bar");
const closeBtnContainer = document.getElementById("close-btn-container");
const closeBtn = document.getElementById("close-btn");
const grabHandle = document.getElementById("grab-icon-container");

mainWindow.addEventListener("mouseenter", () => {
  closeBtnContainer.style.display = "block";
  grabHandle.style.display = "none";
});

mainWindow.addEventListener("mouseleave", () => {
  closeBtnContainer.style.display = "none";
  grabHandle.style.display = "block";
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
  document.getElementById("clock").textContent =
    now.toLocaleTimeString();
}

setInterval(updateClock, 1000);
updateClock();
