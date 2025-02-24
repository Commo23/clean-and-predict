import { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell
} from 'recharts';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import DataTable from './DataTable';

interface DataVisualizationProps {
  data: any[] | null;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

const DataVisualization = ({ data: initialData }: DataVisualizationProps) => {
  const [data, setData] = useState(initialData);
  const [chartType, setChartType] = useState('line');
  const [xAxis, setXAxis] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isTimeSeries, setIsTimeSeries] = useState(false);

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

      default:
        return null;
    }
  };

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
            <DataTable data={data} onDataChange={setData} />
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-6">
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
                </SelectContent>
              </Select>

              <Select value={xAxis} onValueChange={setXAxis}>
                <SelectTrigger>
                  <SelectValue placeholder="Select X axis" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(column => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTimeSeries"
                  checked={isTimeSeries}
                  onCheckedChange={(checked) => setIsTimeSeries(!!checked)}
                />
                <label htmlFor="isTimeSeries" className="text-sm">
                  Is Time Series
                </label>
              </div>
            </div>

            <Card className="p-4">
              <ScrollArea className="h-48 mb-4">
                <div className="space-y-2 p-4">
                  <h4 className="font-medium mb-2">Select Y-axis variables:</h4>
                  {columns
                    .filter(col => col !== xAxis)
                    .map(column => (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox
                          id={column}
                          checked={selectedColumns.includes(column)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedColumns(prev => [...prev, column]);
                            } else {
                              setSelectedColumns(prev => prev.filter(col => col !== column));
                            }
                          }}
                        />
                        <label htmlFor={column} className="text-sm">
                          {column}
                        </label>
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
