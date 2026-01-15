import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VoiceDictationButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceDictationButton({
  isListening,
  onToggle,
  disabled = false,
  className,
}: VoiceDictationButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={isListening ? "default" : "ghost"}
          className={cn(
            "h-7 w-7 shrink-0",
            isListening && "animate-pulse bg-destructive hover:bg-destructive/90",
            !isListening && "text-muted-foreground hover:text-foreground",
            className
          )}
          onClick={onToggle}
          disabled={disabled}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isListening ? "Stop dictation" : "Voice input"}
      </TooltipContent>
    </Tooltip>
  );
}
