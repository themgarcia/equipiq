import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UserDisplayCellProps {
  userId: string | null;
  displayName: {
    name: string;
    company: string | null;
    isUnknown: boolean;
  };
}

export function UserDisplayCell({ userId, displayName }: UserDisplayCellProps) {
  const content = (
    <div className="flex flex-col min-w-0">
      <span className={`font-medium truncate ${displayName.isUnknown ? 'text-muted-foreground font-mono text-xs' : ''}`}>
        {displayName.name}
      </span>
      {displayName.company && (
        <span className="text-xs text-muted-foreground truncate">
          {displayName.company}
        </span>
      )}
    </div>
  );

  if (!userId) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default max-w-[180px]">
          {content}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-xs">
        {userId}
      </TooltipContent>
    </Tooltip>
  );
}
