"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Progress } from "./ui/progress"; // Import ShadCN Progress component
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { CheckCircle, AlertCircle, Camera } from "lucide-react";

export function PopupContent() {
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Helper function to check if image is sensitive
  const isSensitive = (prediction: string) => {
    return prediction === "The image is sensitive.";
  };

  useEffect(() => {
    let mounted = true;
    let port: chrome.runtime.Port | null = null;

    const setupConnection = () => {
      port = chrome.runtime.connect({ name: "popup" });

      port.onMessage.addListener((message) => {
        if (!mounted) return;

        if (message.type === "PREDICTION_UPDATED") {
          setPrediction(message.prediction);
          setLoading(false);
        }
      });

      chrome.runtime.sendMessage({ type: "GET_LAST_IMAGE_AND_PREDICTION" }, (response) => {
        if (!mounted) return;

        if (response?.image) {
          setImage(response.image);
          setPrediction(response.prediction);
          setLoading(response.prediction === "Loading...");
        }
      });
    };

    setupConnection();

    return () => {
      mounted = false;
      if (port) {
        port.disconnect();
      }
    };
  }, []);

  // Progress bar animation effect
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

  return (
    <div className="w-[400px] max-h-[600px] bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Image Sensitivity Detector</h1>
          <p className="text-sm text-muted-foreground">Analyzing social media images</p>
        </div>
        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
          <Camera className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>

      <Separator className="my-4" />

      {/* Image Display */}
      {image ? (
        <Card>
          <CardContent className="p-0 relative">
            <div className="aspect-video relative overflow-hidden rounded-lg group">
              <Image
                src={image}
                alt="Captured Image"
                layout="fill"
                objectFit="contain"
                className="rounded-lg transform transition duration-300 ease-in-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <Badge className="absolute bottom-2 left-2" variant="secondary">
                Captured Image
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 text-muted-foreground">
              <Camera className="h-12 w-12" />
            </div>
            <h3 className="font-medium">No image captured</h3>
            <p className="text-sm text-muted-foreground">Upload an image on social media to analyze</p>
          </CardContent>
        </Card>
      )}

      <Separator className="my-4" />

      {/* Prediction Result */}
      {prediction && (
        <Alert
          variant={
            loading ? "default" : isSensitive(prediction) ? "destructive" : "success"
          }
          className="mt-4"
        >
          {loading ? (
            <div className="w-full">
              <Progress
                className="h-2 bg-primary/20 transition-all duration-300 ease-in-out"
                value={progress}
              />
            </div>
          ) : isSensitive(prediction) ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>Analysis Result</AlertTitle>
          <AlertDescription>
            {loading ? "Analyzing image..." : prediction}
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-4" />

      {/* Supported Platforms */}
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground">Supported platforms:</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Twitter</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Instagram</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Facebook</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PopupContent;
