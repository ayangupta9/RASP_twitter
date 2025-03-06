import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle } from "lucide-react";
import { FeedbackValue, Platform } from "@/src/lib/types";

interface FeedbackFormProps {
  image: string | null;
  prediction: string | null;
  platform: Platform;
  onSubmitFeedback: (data: {
    image: string;
    image_label: string;
    model_prediction: string;
    user_feedback: FeedbackValue;
    platform: Platform;
  }) => Promise<void>;
  onFeedbackComplete?: () => void;
}

export function FeedbackForm({ 
  image, 
  prediction, 
  platform, 
  onSubmitFeedback,
  onFeedbackComplete
}: FeedbackFormProps) {
  const [feedbackValue, setFeedbackValue] = useState<FeedbackValue | "">("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true); // NEW STATE TO HIDE COMPONENT

  useEffect(() => {
    if (feedbackSubmitted) {
      const timer = setTimeout(() => {
        onFeedbackComplete?.(); // Inform parent to remove feedback form
      }, 5000);
  
      return () => clearTimeout(timer);
    }
  }, [feedbackSubmitted]);
  

  const handleSubmit = async () => {
    if (!feedbackValue) return;
    if (!image || !prediction) {
      setError("Something went wrong! Missing image or prediction.");
      return;
    }

    try {
      await onSubmitFeedback({
        image, 
        image_label: prediction,
        model_prediction: prediction,
        user_feedback: feedbackValue as FeedbackValue,
        platform
      });

      setFeedbackSubmitted(true);
      if (onFeedbackComplete) onFeedbackComplete();
    } catch (error) {
      console.error("Feedback submission failed", error);
      setError("Failed to submit feedback. Please try again.");
    }
  };

  if (!visible) return null; // Completely removes the form after timeout

  return (
    <div className="space-y-4 mt-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      
      {feedbackSubmitted ? (
        <Alert variant="success" className="mt-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <div>
              <AlertTitle>Thank you!</AlertTitle>
              <AlertDescription>Your feedback helps improve our detection system.</AlertDescription>
            </div>
          </div>
        </Alert>
      ) : (
        <>
          <p className="text-sm text-muted-foreground text-center">Was this prediction accurate?</p>
          
          <RadioGroup 
            value={feedbackValue} 
            onValueChange={(value) => setFeedbackValue(value as FeedbackValue)}
            className="flex flex-col space-y-2"
          >
            {[
              { value: "sensitive", label: "The Image is Sensitive" },
              { value: "not-sensitive", label: "The Image is not Sensitive" },
              { value: "unsure", label: "I am not sure" },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center space-x-2 cursor-pointer">
                <RadioGroupItem value={value} id={value} />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </RadioGroup>

          <Button 
            onClick={handleSubmit} 
            disabled={!feedbackValue} 
            className="w-full"
          >
            Submit Feedback
          </Button>
        </>
      )}
    </div>
  );
}