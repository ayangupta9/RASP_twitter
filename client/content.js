(function () {
  console.log("Content script loaded: Observing Twitter, Instagram & Facebook for image uploads.");

  /** PLATFORM DETECTION */
  const hostname = window.location.hostname;

  if (hostname.includes("twitter.com")) {
      console.log("Twitter detected - Starting image capture for Twitter.");
      observeTwitter();
  } else if (hostname.includes("instagram.com")) {
      console.log("Instagram detected - Starting image capture for Instagram.");
      observeInstagram();
  } else if (hostname.includes("facebook.com")) {
      console.log("Facebook detected - Starting image capture for Facebook.");
      observeFacebook();
  } else {
      console.log("This script does not support this website.");
  }

  /** TWITTER IMAGE DETECTION */
  function observeTwitter() {
      const twitterObserver = new MutationObserver(() => {
          const toolBar = document.querySelector('[data-testid="toolBar"]');
          if (toolBar) {
              const fileInput = toolBar.querySelector('[data-testid="fileInput"]');

              if (fileInput && !fileInput.dataset.listenerAdded) {
                  console.log("Twitter File input found:", fileInput);
                  fileInput.dataset.listenerAdded = "true"; // Prevent duplicate listeners
                  
                  fileInput.addEventListener("change", handleFileChange);
                  twitterObserver.disconnect(); // Stop observing once input is found and handled
              }
          }
      });

      twitterObserver.observe(document.body, { childList: true, subtree: true });

      function handleFileChange(event) {
          const file = event.target.files[0];

          if (file && file.type.startsWith("image/")) {
              const reader = new FileReader();

              reader.onload = (e) => {
                  const base64Image = e.target.result;
                  console.log("Twitter Image captured and sending to background script.");

                  chrome.runtime.sendMessage({
                      type: "IMAGE_CAPTURED",
                      source: "twitter",
                      payload: base64Image
                  }, (response) => {
                      if (chrome.runtime.lastError) {
                          console.error("Error sending Twitter image:", chrome.runtime.lastError);
                      } else {
                          console.log("Twitter Image successfully sent:", response);
                      }
                  });
              };

              reader.onerror = (error) => {
                  console.error("Error reading Twitter image file:", error);
              };

              reader.readAsDataURL(file);
          } else {
              console.log("No valid Twitter image file selected.");
          }
      }
  }

  /** INSTAGRAM IMAGE DETECTION */
  function observeInstagram() {
      function detectInstagramImages() {
          const allDivs = document.querySelectorAll('div');

          const imageDivs = Array.from(allDivs).filter(div => {
              const bgImage = window.getComputedStyle(div).backgroundImage;
              return bgImage && bgImage.includes('url');
          });

          const imageUrls = [...new Set(imageDivs.map(div => {
              const bgImage = window.getComputedStyle(div).backgroundImage;
              return bgImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
          }).filter(Boolean))]; // Remove null/undefined values

          imageUrls.forEach(imageUrl => {
              if (imageUrl.startsWith("blob:")) {
                  convertBlobToBase64(imageUrl)
                      .then(base64 => {
                          console.log("Instagram Blob Image converted to Base64 and sending.");

                          chrome.runtime.sendMessage({
                              type: "IMAGE_CAPTURED",
                              source: "instagram",
                              payload: base64
                          });
                      })
                      .catch(error => console.error("Error converting Instagram blob image:", error));
              }
          });
      }

      // Observe DOM for Instagram images dynamically
      const instagramObserver = new MutationObserver(() => {
          detectInstagramImages();
      });

      instagramObserver.observe(document.body, { childList: true, subtree: true });

      // Initial check in case images are already present
      detectInstagramImages();
  }

  /** FACEBOOK IMAGE DETECTION */
  function observeFacebook() {
      function detectFacebookImages() {
          const allImages = document.querySelectorAll('img');

          const imageUrls = Array.from(allImages).map(img => img.src);

          console.log(`Facebook: Detected ${imageUrls.length} images.`);

          const blobUrls = imageUrls.filter(url => url.startsWith("blob:"));

          blobUrls.forEach(blobUrl => {
              convertBlobToBase64(blobUrl)
                  .then(base64 => {
                      console.log("Facebook Blob Image converted to Base64 and sending.");

                      chrome.runtime.sendMessage({
                          type: "IMAGE_CAPTURED",
                          source: "facebook",
                          payload: base64
                      });
                  })
                  .catch(error => console.error("Error converting Facebook blob image:", error));
          });
      }

      // Observe DOM for Facebook images dynamically
      const facebookObserver = new MutationObserver(() => {
          detectFacebookImages();
      });

      facebookObserver.observe(document.body, { childList: true, subtree: true });

      // Initial check in case images are already present
      detectFacebookImages();
  }

  /** Convert Blob URL to Base64 */
  function convertBlobToBase64(blobUrl) {
      return fetch(blobUrl)
          .then(response => response.blob())
          .then(blob => new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
          }));
  }
})();
