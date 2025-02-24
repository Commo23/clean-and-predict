
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ChartControlsProps {
  chartType: string;
  setChartType: (type: string) => void;
  xAxis: string;
  columns: string[];
  isTimeSeries: boolean;
  setIsTimeSeries: (value: boolean) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

const ChartControls = ({
  chartType,
  setChartType,
  xAxis,
  columns,
  isTimeSeries,
  setIsTimeSeries,
  onDragOver,
  onDrop
}: ChartControlsProps) => {
  const { toast } = useToast();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Select value={chartType} onValueChange={setChartType}>
        <SelectTrigger>
          <SelectValue placeholder="Select chart type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="line">Line Chart</SelectItem>
          <SelectItem value="area">Area Chart</SelectItem>
          <SelectItem value="bar">Bar Chart</SelectItem>
          <SelectItem value="scatter">Scatter Plot</SelectItem>
          <SelectItem value="composed">Composed Chart</SelectItem>
          <SelectItem value="pie">Pie Chart</SelectItem>
          <SelectItem value="radar">Radar Chart</SelectItem>
        </SelectContent>
      </Select>

      <div 
        className="border-2 border-dashed p-2 rounded"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <p className="text-sm font-medium mb-2">X-Axis:</p>
        {xAxis ? (
          <div className="bg-primary/10 p-2 rounded">
            {xAxis}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Drop column here</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isTimeSeries"
          checked={isTimeSeries}
          onCheckedChange={(checked) => {
            setIsTimeSeries(!!checked);
            if (checked) {
              toast({
                title: "Time Series Mode",
                description: "Please select a date column for the X-axis"
              });
            }
          }}
        />
        <label htmlFor="isTimeSeries" className="text-sm">
          Is Time Series
        </label>
      </div>
    </div>
  );
};

export default ChartControls;
