
import { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';

interface DataVisualizationProps {
  data: any[] | null;
}

const DataVisualization = ({ data }: DataVisualizationProps) => {
  const [chartType, setChartType] = useState('line');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || !xAxis || !yAxis) return [];
    return data.map(row => ({
      x: row[xAxis],
      y: parseFloat(row[yAxis])
    })).filter(row => !isNaN(row.y));
  }, [data, xAxis, yAxis]);

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please upload some data to begin visualization
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger>
            <SelectValue placeholder="Select chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="scatter">Scatter Plot</SelectItem>
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

        <Select value={yAxis} onValueChange={setYAxis}>
          <SelectTrigger>
            <SelectValue placeholder="Select Y axis" />
          </SelectTrigger>
          <SelectContent>
            {columns.map(column => (
              <SelectItem key={column} value={column}>
                {column}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4 h-[400px]">
        {xAxis && yAxis && (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="y" stroke="#8884d8" />
              </LineChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="y" fill="#8884d8" />
              </BarChart>
            ) : (
              <ScatterChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Scatter data={chartData} fill="#8884d8">
                  <XAxis dataKey="x" />
                  <YAxis dataKey="y" />
                </Scatter>
              </ScatterChart>
            )}
          </ResponsiveContainer>
        )}
      </Card>

      <ScrollArea className="h-64 rounded-md border">
        <div className="p-4">
          <h3 className="font-medium mb-2">Data Preview</h3>
          <table className="w-full">
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column} className="text-left p-2 bg-gray-50">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {columns.map(column => (
                    <td key={column} className="p-2 border-t">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DataVisualization;
