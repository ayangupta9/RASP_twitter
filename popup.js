document.addEventListener("DOMContentLoaded", function () {
    console.log("Popup loaded");
    
    const displayImage = document.getElementById("displayImage");
    const imageContainer = document.getElementById("imageContainer");
    const predictionContainer = document.getElementById("predictionContainer");
    const predictionResult = document.getElementById("predictionResult");
    const predictionIcon = document.getElementById("predictionIcon");
    const noImageMessage = document.getElementById("noImageMessage");

    function updatePredictionUI(prediction) {
        console.log("Updating prediction UI:", prediction);
        predictionResult.textContent = prediction;
        
        const isSensitive = prediction.includes("sensitive");
        const isNonSensitive = prediction.includes("non-sensitive");
        
        predictionIcon.innerHTML = isNonSensitive 
            ? '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
            : '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    }

    function showImage(imageData) {
        console.log("Showing image in popup");
        displayImage.src = imageData;
        imageContainer.classList.remove("hidden");
        predictionContainer.classList.remove("hidden");
        noImageMessage.classList.add("hidden");
    }

    // Get last image and prediction when popup opens
    chrome.runtime.sendMessage({ type: "GET_LAST_IMAGE_AND_PREDICTION" }, (response) => {
        console.log("Received response from background:", response);
        if (response && response.image) {
            showImage(response.image);
            if (response.prediction) {
                updatePredictionUI(response.prediction);
            }
        }
    });

    // Listen for updates
    chrome.runtime.onMessage.addListener((message) => {
        console.log("Popup received message:", message);
        if (message.type === "PREDICTION_UPDATED") {
            predictionContainer.classList.remove("hidden");
            updatePredictionUI(message.prediction);
        }
    });
});