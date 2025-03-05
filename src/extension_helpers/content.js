(function () {
    console.log("Content script loaded: Observing social media platforms for image uploads");

    const hostname = window.location.hostname;

    // Function to disable the Facebook "Post" button
    function disablePostButton() {
        const postButton = document.querySelector('div[aria-label="Post"]');
        if (postButton) {
            postButton.setAttribute("disabled", "true");
            postButton.style.pointerEvents = "none";
            postButton.style.opacity = "0.5";
            console.log("Post button disabled");
        }
    }

    // Function to enable the Facebook "Post" button
    function enablePostButton() {
        const postButton = document.querySelector('div[aria-label="Post"]');
        if (postButton) {
            postButton.removeAttribute("disabled");
            postButton.style.pointerEvents = "auto";
            postButton.style.opacity = "1";
            console.log("Post button re-enabled");
        }
    }

    function disableXPostButton() {
        const tweetButton = document.querySelector('[data-testid="tweetButtonInline"]');
        if (tweetButton) {
            tweetButton.disabled = true;
            tweetButton.style.cursor = "not-allowed";
            tweetButton.style.opacity = "0.5";
        }
    }

    function enableXPostButton() {
        const tweetButton = document.querySelector('[data-testid="tweetButtonInline"]');
        if (tweetButton) {
            tweetButton.disabled = false;
            tweetButton.style.cursor = "pointer";
            tweetButton.style.opacity = "1";
        }
    }

    function disableInstagramPostButton() {
        const buttons = document.querySelectorAll('div[role="button"][tabindex="0"]');
        buttons.forEach(button => {
            if (button.textContent.trim() === "Next") {
                button.style.pointerEvents = "none";
                button.style.opacity = "0.5";
                button.style.cursor = "not-allowed";
            }
        });
    }

    function enableInstagramPostButton() {
        const buttons = document.querySelectorAll('div[role="button"][tabindex="0"]');
        buttons.forEach(button => {
            if (button.textContent.trim() === "Next") {
                button.style.pointerEvents = "auto";
                button.style.opacity = "1";
                button.style.cursor = "pointer";
            }
        });
    }

    function handlePrediction(prediction) {
        console.log("Prediction received:", prediction);
        if (prediction === "The image is non-sensitive.") {
            enablePostButton();
            enableXPostButton();
            enableInstagramPostButton();
        } else if (prediction === "The image is sensitive.") {
            disablePostButton();
            disableXPostButton();
            disableInstagramPostButton();
            chrome.runtime.sendMessage({
                type: "SHOW_CONFIRMATION",
                prediction: prediction
            });
        }
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Content] Received message:', message);

        if (message.type === "PREDICTION_UPDATED") {
            handlePrediction(message.prediction);
        }

        if (message.type === "ENABLE_POST_BUTTON" && message.param === "Facebook") {
            enablePostButton();
            sendResponse({ status: "Post button enabled in content script" });
        }

        if (message.type === "DISABLE_POST_BUTTON" && message.param === "Facebook") {
            disablePostButton();
        }

        if (message.type === "ENABLE_POST_BUTTON" && message.param === "X") {
            enableXPostButton();
            sendResponse({ status: "X Post button enabled in content script" });
        }

        if (message.type === "DISABLE_POST_BUTTON" && message.param === "X") {
            disableXPostButton();
        }

        if (message.type === "ENABLE_POST_BUTTON" && message.param === "Instagram") {
            enableInstagramPostButton();
            sendResponse({ status: "Instagram Post button enabled in content script" });
        }

        if (message.type === "DISABLE_POST_BUTTON" && message.param === "Instagram") {
            disableInstagramPostButton();
        }

        return true;
    });

    // ** Handle file input (fixed) **
    function handleFileInput(inputElement) {
        inputElement.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file && file.type.startsWith("image/")) {
                console.log("Processing uploaded image:", file.name);
                const reader = new FileReader();
                reader.onload = (e) => {
                    chrome.runtime.sendMessage({
                        type: "IMAGE_CAPTURED",
                        source: hostname,
                        payload: e.target.result
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Monitor DOM changes for dynamically added file inputs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'INPUT' && node.type === 'file') {
                        handleFileInput(node);
                    }
                    node.querySelectorAll('input[type="file"]').forEach(handleFileInput);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['type']
    });

    document.querySelectorAll('input[type="file"]').forEach(handleFileInput);

    // ** Handle drag and drop (fixed) **
    document.addEventListener('dragover', (event) => {
        event.preventDefault();
    }, false);

    document.addEventListener('drop', (event) => {
        event.preventDefault();
        console.log("Drop event detected");
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    console.log("Processing dropped image:", file.name);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        chrome.runtime.sendMessage({
                            type: "IMAGE_CAPTURED",
                            source: hostname,
                            payload: e.target.result
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }, false);

    // ** Handle paste events (fixed) **
    document.addEventListener('paste', (event) => {
        const items = event.clipboardData.items;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        console.log("Processing pasted image");
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            chrome.runtime.sendMessage({
                                type: "IMAGE_CAPTURED",
                                source: hostname,
                                payload: e.target.result
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
        }
    });

})();
