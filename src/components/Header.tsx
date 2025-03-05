// components/Header.tsx
import { ShieldPlus } from "lucide-react";
import { Separator } from "./ui/separator";
import { ModeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Image Sensitivity Detector</h1>
          <p className="text-sm text-muted-foreground">Analyzing social media images</p>
        </div>
        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
          <ShieldPlus 
          className="h-6 w-6 text-primary-foreground" />
        </div>
        <ModeToggle />
      </div>
      <Separator className="my-4" />
    </>
  );
}