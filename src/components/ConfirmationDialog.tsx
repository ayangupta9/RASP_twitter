import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { CircleAlert } from "lucide-react";

interface ConfirmationDialogProps {
  handleConfirm: () => void;
  handleReject: () => void;
  message?: string;
  confirmText?: string;
  rejectText?: string;
}

export function ConfirmationDialog({
  handleConfirm,
  handleReject,
  message = "This image appears to contain sensitive content. Do you want to proceed with posting?",
  confirmText = "Proceed anyway",
  rejectText = "Cancel",
}: ConfirmationDialogProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex items-center space-x-2 font-semibold">
        <CircleAlert className="w-5 h-5" />
        <span>Sensitive Content Detected</span>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{message}</p>
      </CardContent>
      <CardFooter className="flex justify-between space-x-2">
        <Button 
          onClick={handleConfirm} 
          className="flex-1"
          variant="destructive"
          aria-label={confirmText}
        >
          {confirmText}
        </Button>
        <Button 
          onClick={handleReject} 
          className="flex-1"
          aria-label={rejectText}
        >
          {rejectText}
        </Button>
      </CardFooter>
    </Card>
  );
}
