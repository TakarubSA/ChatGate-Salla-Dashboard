import { Plus, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  createTemplateVariableToken,
  getNextTemplateVariableNumber,
} from './types';

export interface VariablePickerProps {
  usedVariables: number[];
  onInsert: (token: string, variableNumber: number) => void;
  maxVariables?: number;
  disabled?: boolean;
  className?: string;
}

export function VariablePicker({
  usedVariables,
  onInsert,
  maxVariables = 20,
  disabled = false,
  className,
}: VariablePickerProps) {
  const sortedVariables = Array.from(new Set(usedVariables)).sort(
    (a, b) => a - b,
  );
  const nextVariable = getNextTemplateVariableNumber(sortedVariables);
  const canAddVariable = nextVariable <= maxVariables;

  const insertVariable = (variableNumber: number) => {
    onInsert(createTemplateVariableToken(variableNumber), variableNumber);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn('shrink-0', className)}
        >
          <Variable className="h-4 w-4" />
          Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Template variables</p>
          </div>

          <Button
            type="button"
            size="sm"
            className="w-full justify-start"
            onClick={() => insertVariable(nextVariable)}
            disabled={!canAddVariable}
          >
            <Plus className="h-4 w-4" />
            Insert {createTemplateVariableToken(nextVariable)}
          </Button>

          {sortedVariables.length > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-4 gap-2">
                {sortedVariables.map((variableNumber) => (
                  <Button
                    key={variableNumber}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2 font-mono text-xs"
                    onClick={() => insertVariable(variableNumber)}
                  >
                    {createTemplateVariableToken(variableNumber)}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
