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
import { Plus, Trash } from 'lucide-react';

interface DataVisualizationProps {
  data: any[] | null;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

const DataVisualization = ({ data: initialData }: DataVisualizationProps) => {
  const [data, setData] = useState(initialData);
  const [charts, setCharts] = useState([
    {
      id: 1,
      chartType: 'line',
      xAxis: '',
      selectedColumns: [] as string[],
      isTimeSeries: false
    }
  ]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || !xAxis || selectedColumns.length === 0) return [];

    if (isTimeSeries) {
      // Trier les données par date si c'est une série temporelle
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

  const renderChart = ({ chartType, data, xAxis, selectedColumns, isTimeSeries }: {
    chartType: string,
    data: any[],
    xAxis: string,
    selectedColumns: string[],
    isTimeSeries: boolean
  }) => {
    if (!data || !xAxis || selectedColumns.length === 0) return null;

    const chartData = data.map(row => ({
      x: row[xAxis],
      ...selectedColumns.reduce((acc, col) => ({
        ...acc,
        [col]: parseFloat(row[col]) || null
      }), {})
    }));

    const commonProps = {
      width: "100%",
      height: "100%",
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

  const addNewChart = () => {
    setCharts(prev => [...prev, {
      id: Date.now(),
      chartType: 'line',
      xAxis: '',
      selectedColumns: [],
      isTimeSeries: false
    }]);
  };

  const removeChart = (id: number) => {
    setCharts(prev => prev.filter(chart => chart.id !== id));
  };

  const updateChart = (id: number, updates: Partial<typeof charts[0]>) => {
    setCharts(prev => prev.map(chart =>
      chart.id === id ? { ...chart, ...updates } : chart
    ));
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
            <Button onClick={addNewChart}>
              <Plus className="w-4 h-4 mr-1" />
              Add New Chart
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart) => (
                <Card key={chart.id} className="p-4">
                  <div className="flex justify-between mb-4">
                    <Select
                      value={chart.chartType}
                      onValueChange={(value) => updateChart(chart.id, { chartType: value })}
                    >
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChart(chart.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Select
                      value={chart.xAxis}
                      onValueChange={(value) => updateChart(chart.id, { xAxis: value })}
                    >
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
                        checked={chart.isTimeSeries}
                        onCheckedChange={(checked) =>
                          updateChart(chart.id, { isTimeSeries: !!checked })
                        }
                        id={`timeSeries-${chart.id}`}
                      />
                      <label htmlFor={`timeSeries-${chart.id}`} className="text-sm">
                        Time Series
                      </label>
                    </div>
                  </div>

                  <ScrollArea className="h-48 mb-4">
                    <div className="space-y-2 p-4">
                      <h4 className="font-medium mb-2">Select Y-axis variables:</h4>
                      {columns
                        .filter(col => col !== chart.xAxis)
                        .map(column => (
                          <div key={column} className="flex items-center space-x-2">
                            <Checkbox
                              checked={chart.selectedColumns.includes(column)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateChart(chart.id, {
                                    selectedColumns: [...chart.selectedColumns, column]
                                  });
                                } else {
                                  updateChart(chart.id, {
                                    selectedColumns: chart.selectedColumns.filter(
                                      col => col !== column
                                    )
                                  });
                                }
                              }}
                            />
                            <label className="text-sm">
                              {column}
                            </label>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart({
                        chartType: chart.chartType,
                        data,
                        xAxis: chart.xAxis,
                        selectedColumns: chart.selectedColumns,
                        isTimeSeries: chart.isTimeSeries
                      })}
                    </ResponsiveContainer>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;
