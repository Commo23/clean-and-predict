
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface ColumnSelectorProps {
  columns: string[];
  xAxis: string;
  selectedColumns: string[];
  setSelectedColumns: (columns: string[]) => void;
  onDragStart: (column: string) => void;
}

const ColumnSelector = ({
  columns,
  xAxis,
  selectedColumns,
  setSelectedColumns,
  onDragStart
}: ColumnSelectorProps) => {
  return (
    <ScrollArea className="h-48 mb-4">
      <div className="space-y-2 p-4 border-2 border-dashed rounded">
        <h4 className="font-medium mb-2">Y-axis variables (drag columns here):</h4>
        {columns
          .filter(col => col !== xAxis)
          .map(column => (
            <div 
              key={column} 
              className="flex items-center space-x-2 cursor-move"
              draggable
              onDragStart={() => onDragStart(column)}
            >
              <div className="flex items-center space-x-2 bg-background p-2 rounded border">
                <Checkbox
                  checked={selectedColumns.includes(column)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedColumns([...selectedColumns, column]);
                    } else {
                      setSelectedColumns(selectedColumns.filter(col => col !== column));
                    }
                  }}
                />
                <label className="text-sm">
                  {column}
                </label>
              </div>
            </div>
          ))}
      </div>
    </ScrollArea>
  );
};

export default ColumnSelector;
