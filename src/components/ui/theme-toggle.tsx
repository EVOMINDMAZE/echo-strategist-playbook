
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
    >
      <Settings className="h-5 w-5 text-gray-600" />
      <span className="sr-only">Settings</span>
    </Button>
  );
};
