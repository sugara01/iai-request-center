import type { ComponentType, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ActionIconButtonProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

export function ActionIconButton({ label, icon: Icon, onClick, disabled = false }: ActionIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={label} onClick={onClick}>
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
