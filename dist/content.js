(function () {
    console.log("Content script loaded: Observing social media platforms for image uploads");

    const hostname = window.location.hostname;

    // Create a style element for debugging
    const style = document.createElement('style');
    style.textContent = '.monitored-input { outline: 2px solid transparent !important; }';
    document.head.appendChild(style);

    // Generic file input handler
    function handleFileInput(input) {
        if (!input.dataset.monitored) {
            console.log("Setting up new file input:", input);
            input.dataset.monitored = 'true';
            input.classList.add('monitored-input');

            input.addEventListener('change', function(event) {
                console.log("File input change detected");
                const files = event.target.files;
                if (files && files.length > 0) {
                    Array.from(files).forEach(file => {
                        if (file.type.startsWith('image/')) {
                            console.log("Processing image:", file.name);
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                console.log("Image read successfully, sending to background");
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
            });
        }
    }

    // Monitor DOM changes for dynamically added file inputs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Check the added element itself
                    if (node.tagName === 'INPUT' && node.type === 'file') {
                        handleFileInput(node);
                    }
                    // Check children of added element
                    node.querySelectorAll('input[type="file"]').forEach(handleFileInput);
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['type']
    });

    // Check existing file inputs
    document.querySelectorAll('input[type="file"]').forEach(handleFileInput);

    // Handle drag and drop
    document.addEventListener('dragover', function(event) {
        event.preventDefault();
    }, false);

    document.addEventListener('drop', function(event) {
        event.preventDefault();
        console.log("Drop event detected");
        const items = event.dataTransfer?.items;
        if (items) {
            Array.from(items).forEach(item => {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file && file.type.startsWith('image/')) {
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
                }
            });
        }
    }, false);

    // Handle paste events
    document.addEventListener('paste', function(event) {
        const items = event.clipboardData?.items;
        if (items) {
            Array.from(items).forEach(item => {
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
            });
        }
    });
})();