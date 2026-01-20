const container = document.getElementById("progress-container");
const bar = document.getElementById("progress-bar");

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
