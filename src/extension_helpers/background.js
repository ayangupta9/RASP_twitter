let lastCapturedImage = null;
let lastPrediction = null;
let activePort = null;

// Handle long-lived connections
chrome.runtime.onConnect.addListener((port) => {
    console.log("New connection established");
    activePort = port;
    
    port.onDisconnect.addListener(() => {
        console.log("Connection closed");
        activePort = null;
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received message:", message.type);
    
    if (message.type === "IMAGE_CAPTURED") {
        console.log("Image captured from source:", message.source);
        lastCapturedImage = message.payload;
        lastPrediction = "Loading...";

        // Show the extension icon badge
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
        
        // Show the popup by programmatically clicking the extension icon
        chrome.action.openPopup();
        
        // Process the image
        fetch("http://localhost:3000/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: lastCapturedImage }),
        })
        .then(async (response) => {
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with status ${response.status}: ${errorText}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("Server response received:", data);
            lastPrediction = data.prediction === 0
                ? "The image is sensitive."
                : "The image is non-sensitive.";

            // Clear the badge
            chrome.action.setBadgeText({ text: "" });

            // Notify through port if available
            if (activePort) {
                try {
                    activePort.postMessage({
                        type: "PREDICTION_UPDATED",
                        prediction: lastPrediction,
                    });
                } catch (error) {
                    console.log("Error sending through port:", error);
                }
            }
        })
        .catch((error) => {
            console.error("Error processing image:", error);
            lastPrediction = "Error: Unable to process the image. Please ensure the server is running.";
            
            // Show error in badge
            chrome.action.setBadgeText({ text: "X" });
            chrome.action.setBadgeBackgroundColor({ color: "#F44336" });

            // Notify through port if available
            if (activePort) {
                try {
                    activePort.postMessage({
                        type: "PREDICTION_UPDATED",
                        prediction: lastPrediction,
                    });
                } catch (error) {
                    console.log("Error sending through port:", error);
                }
            }
        });

        // Send immediate response
        sendResponse({ status: "processing" });
    }

    if (message.type === "GET_LAST_IMAGE_AND_PREDICTION") {
        console.log("Sending last image and prediction to popup");
        sendResponse({ 
            image: lastCapturedImage, 
            prediction: lastPrediction 
        });
    }

    return true; // Keep the message channel open for async responses
});

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed/updated");
    lastCapturedImage = null;
    lastPrediction = null;
    chrome.action.setBadgeText({ text: "" });
});