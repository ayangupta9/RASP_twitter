"use client";

import { useState } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      setSelectedImage(base64Image);
      setIsLoading(true);
      setPrediction("Loading...");

      try {
        const response = await fetch("/api/process-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        setPrediction(
          data.prediction === "sensitive"
            ? "The image is sensitive."
            : "The image is non-sensitive."
        );
      } catch (error) {
        console.error("Error processing image:", error);
        setPrediction("Error: Unable to process the image.");
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Image Sensitivity Detector
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image to check its sensitivity level
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG or GIF (MAX. 800x400px)
                  </p>
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {selectedImage && (
              <div className="mt-6">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}

            {prediction && (
              <Alert
                variant={
                  prediction.includes("sensitive")
                    ? "destructive"
                    : prediction.includes("non-sensitive")
                    ? "default"
                    : "destructive"
                }
              >
                {prediction.includes("sensitive") ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>Prediction Result</AlertTitle>
                <AlertDescription>{prediction}</AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}