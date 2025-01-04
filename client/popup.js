document.addEventListener("DOMContentLoaded", function () {
  const displayImage = document.getElementById("displayImage");
  const predictionResult = document.getElementById("predictionResult");

  // Ask the background script for the last captured image and prediction
  chrome.runtime.sendMessage({ type: "GET_LAST_IMAGE_AND_PREDICTION" }, (response) => {
    if (response && response.image) {
      displayImage.src = response.image; // Display the image
      displayImage.alt = "Captured image";

      // Display the initial prediction
      predictionResult.textContent = response.prediction || "Loading...";
    } else {
      displayImage.alt = "No image captured yet.";
      predictionResult.textContent = "No prediction available.";
    }
  });

  // Listen for prediction updates from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "PREDICTION_UPDATED") {
      predictionResult.textContent = message.prediction;
    }
  });
});