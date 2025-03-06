// components/ImageDisplay.tsx
import Image from "next/image";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Camera } from "lucide-react";

interface ImageDisplayProps {
  image: string | null;
}

export function ImageDisplay({ image }: ImageDisplayProps) {
  if (!image) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 text-muted-foreground">
            <Camera className="h-12 w-12" />
          </div>
          <h3 className="font-medium">No image captured</h3>
          <p className="text-sm text-muted-foreground">Upload an image on social media to analyze</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
}