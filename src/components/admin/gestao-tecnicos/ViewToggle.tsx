import { Button } from "@/components/ui/button";
import { Table, Grid } from "lucide-react";

interface ViewToggleProps {
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={viewMode === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="flex items-center space-x-1"
      >
        <Table className="h-4 w-4" />
        <span className="hidden sm:inline">Tabela</span>
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className="flex items-center space-x-1"
      >
        <Grid className="h-4 w-4" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
    </div>
  );
}