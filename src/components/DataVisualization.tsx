import { useState, useMemo, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import DataTable from './DataTable';
import { useToast } from "@/components/ui/use-toast";

interface DataVisualizationProps {
  data: any[] | null;
  onDataChange?: (newData: any[]) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

const DataVisualization = ({ data: initialData, onDataChange }: DataVisualizationProps) => {
  const [data, setData] = useState(initialData);
  const [chartType, setChartType] = useState('line');
  const [xAxis, setXAxis] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isTimeSeries, setIsTimeSeries] = useState(false);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || !xAxis || selectedColumns.length === 0) return [];

    if (isTimeSeries) {
      return data
        .map(row => ({
          date: row[xAxis],
          ...selectedColumns.reduce((acc, col) => ({
            ...acc,
            [col]: parseFloat(row[col]) || null
          }), {})
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return data.map(row => ({
      x: row[xAxis],
      ...selectedColumns.reduce((acc, col) => ({
        ...acc,
        [col]: parseFloat(row[col]) || null
      }), {})
    }));
  }, [data, xAxis, selectedColumns, isTimeSeries]);

  const handleDataSave = (newData: any[]) => {
    setData(newData);
    onDataChange?.(newData);
  };

  const handleDragStart = (column: string) => {
    setDraggingColumn(column);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetArea: 'x-axis' | 'y-axis') => {
    if (!draggingColumn) return;

    if (targetArea === 'x-axis') {
      setXAxis(draggingColumn);
    } else {
      if (!selectedColumns.includes(draggingColumn)) {
        setSelectedColumns(prev => [...prev, draggingColumn]);
      }
    }
    setDraggingColumn(null);
  };

  const renderChart = () => {
    if (!chartData.length) return null;

    const commonProps = {
      width: 500,
      height: 300,
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={isTimeSeries ? "date" : "x"} />
            <YAxis />
            <Tooltip />
            {selectedColumns.map((col, index) => (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                stroke={COLORS[index % COLORS.length]}
                name={col}
                connectNulls
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={isTimeSeries ? "date" : "x"} />
            <YAxis />
            <Tooltip />
            {selectedColumns.map((col, index) => (
              <Area
                key={col}
                type="monotone"
                dataKey={col}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                name={col}
                fillOpacity={0.3}
                stackId="1"
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={isTimeSeries ? "date" : "x"} />
            <YAxis />
            <Tooltip />
            {selectedColumns.map((col, index) => (
              <Bar
                key={col}
                dataKey={col}
                fill={COLORS[index % COLORS.length]}
                name={col}
              />
            ))}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={isTimeSeries ? "date" : "x"} />
            <YAxis />
            <Tooltip />
            {selectedColumns.map((col, index) => (
              index % 2 === 0 ? (
                <Bar
                  key={col}
                  dataKey={col}
                  fill={COLORS[index % COLORS.length]}
                  name={col}
                />
              ) : (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={COLORS[index % COLORS.length]}
                  name={col}
                />
              )
            ))}
          </ComposedChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={isTimeSeries ? "date" : "x"} />
            <YAxis />
            <Tooltip />
            {selectedColumns.map((col, index) => (
              <Scatter
                key={col}
                name={col}
                data={chartData.map(d => ({
                  x: d[isTimeSeries ? "date" : "x"],
                  y: d[col]
                }))}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </ScatterChart>
        );
      case 'pie':
        return (
          <PieChart width={400} height={300}>
            <Pie
              data={chartData}
              dataKey={selectedColumns[0]}
              nameKey={isTimeSeries ? "date" : "x"}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case 'radar':
        return (
          <RadarChart outerRadius={90} width={530} height={300} data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey={isTimeSeries ? "date" : "x"} />
            <PolarRadiusAxis angle={30} domain={[0, 150]} />
            <Radar name="Mike" dataKey={selectedColumns[0]} stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        );

      default:
        return null;
    }
  };

  const renderChartTypeSelect = () => (
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
  );

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please upload some data to begin visualization
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Data Table</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card className="p-4">
            <DataTable 
              data={data} 
              onDataChange={setData} 
              onSave={handleDataSave}
            />
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderChartTypeSelect()}

              <div 
                className="border-2 border-dashed p-2 rounded"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('x-axis')}
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

            <Card className="p-4">
              <ScrollArea className="h-48 mb-4">
                <div 
                  className="space-y-2 p-4 border-2 border-dashed rounded"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop('y-axis')}
                >
                  <h4 className="font-medium mb-2">Y-axis variables (drag columns here):</h4>
                  {columns
                    .filter(col => col !== xAxis)
                    .map(column => (
                      <div 
                        key={column} 
                        className="flex items-center space-x-2 cursor-move"
                        draggable
                        onDragStart={() => handleDragStart(column)}
                      >
                        <div className="flex items-center space-x-2 bg-background p-2 rounded border">
                          <Checkbox
                            checked={selectedColumns.includes(column)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedColumns(prev => [...prev, column]);
                              } else {
                                setSelectedColumns(prev => prev.filter(col => col !== column));
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

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;
