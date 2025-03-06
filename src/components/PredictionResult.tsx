// components/PredictionResult.tsx
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface PredictionResultProps {
  prediction: string | null;
  loading: boolean;
  progress: number;
}

export function PredictionResult({ prediction, loading, progress }: PredictionResultProps) {
  const isSensitive = (predictionText: string) => {
    return predictionText === "The image is sensitive.";
  };

  if (!prediction) return null;

  return (
    <Alert
      variant={loading ? "default" : isSensitive(prediction) ? "destructive" : "success"}
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
  );
}