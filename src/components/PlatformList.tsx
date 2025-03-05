// components/PlatformList.tsx
import { Twitter, Instagram, Facebook } from "lucide-react";

export function PlatformList() {
  return (
    <div className="flex flex-col space-y-2 mt-4">
      <p className="text-sm text-muted-foreground">Supported platforms:</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Twitter className="h-4 w-4" />
          <span className="text-sm">Twitter (X)</span>
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
  );
}
