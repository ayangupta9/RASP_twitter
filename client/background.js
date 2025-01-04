// background.js

// Variable to store the last captured image in memory.
// (You could also use chrome.storage if you want it persisted.)
// Variable to store the last captured image in memory.
// (You could also use chrome.storage if you want it persisted.)
let lastCapturedImage = null;
let lastPrediction = null; // Variable to store the last prediction

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "IMAGE_CAPTURED") {
    lastCapturedImage = message.payload;
    lastPrediction = "Loading..."; // Set initial state to "Loading..."
    console.log("Image received in background:", lastCapturedImage);

    chrome.action.openPopup();
    
    // Send the image to the server
    fetch("http://localhost:8000/process_image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: lastCapturedImage }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        return response.json(); // Parse response as JSON
      })
      .then((data) => {
        console.log("Server response:", data);
        lastPrediction = data.prediction === "sensitive"
          ? "The image is sensitive."
          : "The image is non-sensitive.";

        // Notify all popup scripts of the updated prediction
        chrome.runtime.sendMessage({
          type: "PREDICTION_UPDATED",
          prediction: lastPrediction,
        });
      })
      .catch((error) => {
        console.error("File upload error:", error.message);
        lastPrediction = "Error: Unable to process the image.";

        // Notify all popup scripts of the error
        chrome.runtime.sendMessage({
          type: "PREDICTION_UPDATED",
          prediction: lastPrediction,
        });
      });
  }

  // Handle requests from the popup
  if (message.type === "GET_LAST_IMAGE_AND_PREDICTION") {
    sendResponse({ image: lastCapturedImage, prediction: lastPrediction });
  }

  return true; // Indicates asynchronous response
});
