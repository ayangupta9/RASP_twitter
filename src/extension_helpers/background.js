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

// Message listener for image processing and prediction
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received message:", message.type);
    
    // Handle image capture and processing
    if (message.type === "IMAGE_CAPTURED") {
        console.log("Image captured from source:", message.source);
        lastCapturedImage = message.payload;
        lastPrediction = "Loading...";

        // Show the extension icon badge
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });

        // Process the image
        fetch("http://141.5.109.104:9000/process_image", {
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
            lastPrediction = data.prediction === 1
                ? "The image is sensitive."
                : "The image is non-sensitive.";

            // Clear the badge
            chrome.action.setBadgeText({ text: "" });

            // Notify all tabs about the prediction
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "PREDICTION_UPDATED",
                        prediction: lastPrediction,
                    });
                });
            });

            // Notify popup through port if available
            if (activePort) {
                try {
                    activePort.postMessage({
                        type: "PREDICTION_UPDATED",
                        prediction: lastPrediction,
                    });

                    // If image is sensitive, show confirmation
                    if (lastPrediction === "The image is sensitive.") {
                        activePort.postMessage({
                            type: "SHOW_CONFIRMATION"
                        });
                    }
                } catch (error) {
                    console.log("Error sending through port:", error);
                }
            }
            // Open the popup automatically
            chrome.action.openPopup();
            
        })
        .catch((error) => {
            console.error("Error processing image:", error);
            lastPrediction = "Error: Unable to process the image. Please ensure the server is running.";

            // Show error in badge
            chrome.action.setBadgeText({ text: "X" });
            chrome.action.setBadgeBackgroundColor({ color: "#F44336" });

            // Notify all tabs about the error
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "PREDICTION_UPDATED",
                        prediction: lastPrediction,
                    });
                });
            });

            // Notify popup through port if available
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
        return true;
    }

    // Handle request for last image and prediction
    if (message.type === "GET_LAST_IMAGE_AND_PREDICTION") {
        console.log("Sending last image and prediction to popup");
        sendResponse({ 
            image: lastCapturedImage, 
            prediction: lastPrediction 
        });
        return true;
    }

    // Handle user confirmation for sensitive images
    if (message.type === "USER_CONFIRMATION" && (message.param === "X" || message.param === "Facebook" || message.param === "Instagram")) {
        console.log("User confirmation received:", message.confirmed);
        console.log("User platform received:", message.param);

        
        if (message.confirmed) {
            // Enable post button across all tabs
            console.log("sending message to contentttttt");
            console.log(message.param);
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { 
                        type: "ENABLE_POST_BUTTON",
                        param: message.param
                    });
                });
            });
        } else if (!message.confirmed && (message.param === "X" || message.param === "Facebook" || message.param === "Instagram")) {
            // Ensure post button remains disabled
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { 
                        type: "DISABLE_POST_BUTTON",
                        param: message.param
                    });
                });
            });
        }

        sendResponse({ status: "Confirmation processed" });
        return true;
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