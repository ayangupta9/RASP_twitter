"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

import { Header } from "./Header";
import { ImageDisplay } from "./ImageDisplay";
import { PredictionResult } from "./PredictionResult";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { FeedbackForm } from "./FeedbackForm";
import { PlatformList } from "./PlatformList";
import { 
  FeedbackValue, 
  Platform 
} from "@/src/lib/types";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { CheckCircle } from "lucide-react";

export function PopupContent() {
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [platform, setPlatform] = useState<Platform>("Unknown");
  const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false);
  const [feedbackComplete, setFeedbackComplete] = useState<boolean>(false);

  // Helper function to check if image is sensitive
  const isSensitive = (predictionText: string) => {
    return predictionText === "The image is sensitive.";
  };

  // Progress bar effect
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 95 ? prev + 5 : prev));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [loading]);

  // Chrome runtime connection and message handling
  useEffect(() => {
    let mounted = true;

    // Detect platform
    const detectPlatform = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0 || !tabs[0].url) return;
  
        const url = tabs[0].url;
  
        if (url.includes("x.com")) {
          setPlatform("X");
        } else if (url.includes("instagram.com")) {
          setPlatform("Instagram");
        } else if (url.includes("facebook.com")) {
          setPlatform("Facebook");
        } else {
          setPlatform("Unknown");
        }
      });
    };

    // Setup connection and handle messages
    const setupConnection = () => {
      detectPlatform();

      chrome.runtime.sendMessage({ type: "GET_LAST_IMAGE_AND_PREDICTION" }, (response) => {
        if (!mounted) return;

        if (response?.image) {
          setImage(response.image);
          setPrediction(response.prediction);
          setLoading(response.prediction === "Loading...");
          setFeedbackComplete(false);

          // Show confirmation if sensitive
          if (isSensitive(response.prediction)) {
            setShowConfirmationDialog(true);
          }
        }
      });

      const messageListener = (message: any) => {
        if (!mounted) return;

        if (message.type === "PREDICTION_UPDATED") {
          setPrediction(message.prediction);
          setLoading(false);
          setFeedbackComplete(false);

          // Show confirmation if sensitive
          if (isSensitive(message.prediction)) {
            setShowConfirmationDialog(true);
          }
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    };

    setupConnection();

    return () => {
      mounted = false;
    };
  }, []);

  // Confirmation handlers
  const handleConfirm = () => {
    chrome.runtime.sendMessage({ 
      type: "USER_CONFIRMATION", 
      confirmed: true,
      param: platform
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[Popup] Error sending confirmation:", chrome.runtime.lastError.message);
      } else {
        console.log("[Popup] Confirmation sent successfully");
        setShowConfirmationDialog(false);
      }
    });
  };

  const handleReject = () => {
    chrome.runtime.sendMessage({ 
      type: "USER_CONFIRMATION", 
      confirmed: false,
      param: platform
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[Popup] Error sending rejection:", chrome.runtime.lastError.message);
      } else {
        console.log("[Popup] Rejection sent successfully");
        setShowConfirmationDialog(false);
      }
    });
  };

  // Feedback submission handler
  const handleFeedbackSubmit = async (feedbackData: {
    image: string;
    image_label: string;
    model_prediction: string;
    user_feedback: FeedbackValue;
    platform: Platform;
  }) => {
    setLoading(true);
  
    try {
      const response = await fetch("http://141.5.109.104:9000/submit_feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        console.log("Feedback submitted successfully:", result);
      } else {
        console.error("Error submitting feedback:", result.error);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle feedback completion
  // Handle feedback completion
const handleFeedbackComplete = () => {
  setFeedbackComplete(true);
  // Auto-hide feedback section after 5 seconds
setTimeout(() => {
  setFeedbackComplete(false);
}, 5000);
};

  return (
    <div className="w-[400px] max-h-[600px] bg-background p-4">
      <ScrollArea className="h-full">
        <div>
          <Header />
          <ImageDisplay image={image} />
          <Separator className="my-4" />
          
          <PredictionResult 
            prediction={prediction} 
            loading={loading} 
            progress={progress} 
          />

          {showConfirmationDialog && (
            <ConfirmationDialog 
              handleConfirm={handleConfirm} 
              handleReject={handleReject} 
            />
          )}

{!loading && prediction && !showConfirmationDialog && !feedbackComplete && (
            <FeedbackForm 
              image={image}
              prediction={prediction}
              platform={platform}
              onSubmitFeedback={handleFeedbackSubmit}
              onFeedbackComplete={handleFeedbackComplete}
            />
          )}

          {feedbackComplete && (
            <Alert variant="success" className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Thank you!</AlertTitle>
              <AlertDescription>
                Your feedback helps improve our detection system.
              </AlertDescription>
            </Alert>
          )}

          <PlatformList />
        </div>
      </ScrollArea>
    </div>
  );
}

export default PopupContent;