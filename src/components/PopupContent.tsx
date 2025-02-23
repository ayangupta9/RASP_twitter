import { useState, useEffect } from "react";
import { Camera, AlertCircle, CheckCircle, Twitter, Instagram, Facebook, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

export function PopupContent() {
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Helper function to check if image is sensitive
  const isSensitive = (prediction: string) => {
    return prediction === "The image is sensitive.";
  };

  useEffect(() => {
    let mounted = true;
    let port: chrome.runtime.Port | null = null;

    const setupConnection = () => {
      // Establish a long-lived connection
      port = chrome.runtime.connect({ name: "popup" });

      port.onMessage.addListener((message) => {
        if (!mounted) return;

        if (message.type === "PREDICTION_UPDATED") {
          setPrediction(message.prediction);
          setLoading(false);
        }
      });

      // Get initial state
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

    // Cleanup
    return () => {
      mounted = false;
      if (port) {
        port.disconnect();
      }
    };
  }, []);

  return (
    <div className="w-[400px] max-h-[600px] bg-background">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Image Sensitivity Detector</h1>
              <p className="text-sm text-muted-foreground">
                Analyzing social media images
              </p>
            </div>
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            {image ? (
              <>
                <Card>
                  <CardContent className="p-0 relative">
                    <div className="aspect-video relative overflow-hidden rounded-lg">
                      <img
                        src={image}
                        alt="Captured"
                        className="object-contain w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Badge
                        className="absolute bottom-2 left-2"
                        variant="secondary"
                      >
                        Captured Image
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {prediction && (
                  <Alert
                    variant={
                      loading
                        ? "default"
                        : isSensitive(prediction)
                        ? "destructive"
                        : "success"
                    }
                  >
                    {loading ? (
                      <div className="animate-spin h-4 w-4">⌛</div>
                    ) : isSensitive(prediction) ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>Analysis Result</AlertTitle>
                    <AlertDescription>
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <span>Analyzing image</span>
                          <span className="animate-pulse">...</span>
                        </div>
                      ) : (
                        prediction
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardHeader className="text-center space-y-3">
                  <div className="mx-auto h-12 w-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">No image captured</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload an image on social media to analyze
                    </p>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>

          <Separator />
          
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">Supported platforms:</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Twitter className="h-4 w-4" />
                <span className="text-sm">Twitter</span>
              </div>
              <div className="flex items-center space-x-2">
                <Instagram className="h-4 w-4" />
                <span className="text-sm">Instagram</span>
              </div>
              <div className="flex items-center space-x-2">
                <Facebook className="h-4 w-4" />
                <span className="text-sm">Facebook</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default PopupContent;