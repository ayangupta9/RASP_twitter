// content-script.js
(function() {
    console.log("Content script loaded: Observing Twitter for image uploads.");

    // Because the Twitter toolbar might not appear right away (due to SPAs/React),
    // we use a MutationObserver to detect when the toolbar is added to the DOM.
    const observer = new MutationObserver(() => {
      const toolBar = document.querySelector('[data-testid="toolBar"]');
      if (toolBar) {
        // Find the file input within the toolbar
        const fileInput = toolBar.querySelector('[data-testid="fileInput"]');
        if (fileInput) {
          console.log("File input found:", fileInput);  
          // Add an event listener to capture when a user selects a file
          fileInput.addEventListener("change", handleFileChange);
  
          // Once we find the toolbar and set up the listener, we can disconnect the observer
          observer.disconnect();
        }
      }
    });
  
    // Start observing changes on the entire document (childList + subtree)
    observer.observe(document.body, { childList: true, subtree: true });
  
    function handleFileChange(event) {
      const file = event.target.files[0]; // Only handle the first uploaded file for now
  
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
  
        // When the file is read, it’s converted to a Base64 string
        reader.onload = (e) => {
          const base64Image = e.target.result; 

          // Send the base64 image to the background script immediately
          chrome.runtime.sendMessage({
            type: "IMAGE_CAPTURED",
            payload: base64Image
          });
        };
  
        // Read the file as Data URL (Base64)
        reader.readAsDataURL(file);
      } else {
        console.log("No image file selected or invalid file type.");
      }
    }
  })();