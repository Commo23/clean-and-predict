
import { useState, useMemo, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer } from 'recharts';
import DataTable from './DataTable';
import ChartControls from './visualization/ChartControls';
import ColumnSelector from './visualization/ColumnSelector';
import ChartRenderer from './visualization/ChartRenderer';

interface DataVisualizationProps {
  data: any[] | null;
  onDataChange?: (newData: any[]) => void;
}

const DataVisualization = ({ data: initialData, onDataChange }: DataVisualizationProps) => {
  const [data, setData] = useState(initialData);
  const [chartType, setChartType] = useState('line');
  const [xAxis, setXAxis] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isTimeSeries, setIsTimeSeries] = useState(false);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);

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
            <ChartControls
              chartType={chartType}
              setChartType={setChartType}
              xAxis={xAxis}
              columns={columns}
              isTimeSeries={isTimeSeries}
              setIsTimeSeries={setIsTimeSeries}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('x-axis')}
            />

            <Card className="p-4">
              <ColumnSelector
                columns={columns}
                xAxis={xAxis}
                selectedColumns={selectedColumns}
                setSelectedColumns={setSelectedColumns}
                onDragStart={handleDragStart}
              />

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ChartRenderer
                    chartType={chartType}
                    chartData={chartData}
                    selectedColumns={selectedColumns}
                    isTimeSeries={isTimeSeries}
                  />
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
