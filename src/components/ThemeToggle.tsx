import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThemeToggleProps {
  variant?: "full" | "icon";
}

export function ThemeToggle({ variant = "full" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === "light") return "Light mode";
    if (theme === "dark") return "Dark mode";
    return "System theme";
  };

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            className="h-9 w-9"
          >
            {getIcon()}
            <span className="sr-only">{getLabel()}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLabel()}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleTheme}
          className="w-full justify-start gap-2"
        >
          {getIcon()}
          <span>{getLabel()}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Click to switch theme</p>
      </TooltipContent>
    </Tooltip>
  );
}
