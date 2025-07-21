import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, Legend, RadialBarChart, RadialBar, Brush, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Download, Settings, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { DataRow } from '@/types';
import { getNumericValues, isNumericColumn, isDateColumn } from '@/utils/typeUtils';

interface EnhancedChartProps {
  data: DataRow[];
  chartType: 'line' | 'area' | 'bar' | 'scatter' | 'composed' | 'pie' | 'radar' | 'radialBar' | 'treemap';
  xAxis: string;
  selectedColumns: string[];
  title?: string;
  height?: number;
  width?: number;
}

interface ChartConfig {
  showGrid: boolean;
  showLegend: boolean;
  smoothCurves: boolean;
  showDataPoints: boolean;
  autoScale: boolean;
  logScale: boolean;
  animation: boolean;
  opacity: number;
  strokeWidth: number;
  colorScheme: string;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'
];

const EnhancedChart: React.FC<EnhancedChartProps> = ({
  data,
  chartType,
  xAxis,
  selectedColumns,
  title = 'Graphique',
  height = 400,
  width = '100%'
}) => {
  const [config, setConfig] = useState<ChartConfig>({
    showGrid: true,
    showLegend: true,
    smoothCurves: true,
    showDataPoints: false,
    autoScale: true,
    logScale: false,
    animation: true,
    opacity: 0.8,
    strokeWidth: 2,
    colorScheme: 'default'
  });

  const [showSettings, setShowSettings] = useState(false);

  // Traitement des données avec axes adaptatifs
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let processed = data.map((row, index) => {
      const processedRow: any = { index };
      
      // Traitement de l'axe X
      if (isDateColumn(data, xAxis)) {
        const dateValue = new Date(row[xAxis]);
        processedRow.x = isNaN(dateValue.getTime()) ? row[xAxis] : dateValue;
      } else if (isNumericColumn(data, xAxis)) {
        processedRow.x = parseFloat(row[xAxis]) || 0;
      } else {
        processedRow.x = row[xAxis];
      }

      // Traitement des colonnes Y
      selectedColumns.forEach((col, colIndex) => {
        if (isNumericColumn(data, col)) {
          const value = parseFloat(row[col]);
          if (!isNaN(value)) {
            processedRow[col] = value;
          }
        }
      });

      return processedRow;
    });

    // Tri par axe X si c'est numérique ou une date
    if (isNumericColumn(data, xAxis) || isDateColumn(data, xAxis)) {
      processed.sort((a, b) => {
        if (a.x instanceof Date && b.x instanceof Date) {
          return a.x.getTime() - b.x.getTime();
        }
        return a.x - b.x;
      });
    }

    return processed;
  }, [data, xAxis, selectedColumns]);

  // Calcul des domaines adaptatifs
  const domains = useMemo(() => {
    if (!processedData.length) return { x: [0, 100], y: [0, 100] };

    const xValues = processedData.map(d => d.x).filter(v => v !== null && v !== undefined);
    const yValues = selectedColumns.flatMap(col => 
      processedData.map(d => d[col]).filter(v => v !== null && v !== undefined)
    );

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xPadding = (xMax - xMin) * 0.05;
    const yPadding = (yMax - yMin) * 0.1;

    return {
      x: [xMin - xPadding, xMax + xPadding],
      y: [Math.max(0, yMin - yPadding), yMax + yPadding]
    };
  }, [processedData, selectedColumns]);

  // Formatage des axes
  const formatXAxis = (tickItem: any) => {
    if (tickItem instanceof Date) {
      return tickItem.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
    if (typeof tickItem === 'number') {
      return tickItem.toLocaleString('fr-FR');
    }
    return String(tickItem);
  };

  const formatYAxis = (tickItem: number) => {
    if (config.logScale) {
      return Math.pow(10, tickItem).toLocaleString('fr-FR');
    }
    return tickItem.toLocaleString('fr-FR');
  };

  // Composant de tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${xAxis}: ${formatXAxis(label)}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value?.toLocaleString('fr-FR')}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Rendu du graphique selon le type
  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const axisProps = {
      stroke: '#666',
      fontSize: 12,
      tickLine: false,
      axisLine: true
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
              domain={config.autoScale ? domains.x : undefined}
              type={isDateColumn(data, xAxis) ? 'number' : 'category'}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={config.autoScale ? domains.y : undefined}
              scale={config.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend && <Legend />}
            {selectedColumns.map((col, index) => (
              <Line
                key={col}
                type={config.smoothCurves ? 'monotone' : 'linear'}
                dataKey={col}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={config.strokeWidth}
                dot={config.showDataPoints ? { r: 4 } : false}
                activeDot={{ r: 6 }}
                animationDuration={config.animation ? 1000 : 0}
                opacity={config.opacity}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
              domain={config.autoScale ? domains.x : undefined}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={config.autoScale ? domains.y : undefined}
              scale={config.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend && <Legend />}
            {selectedColumns.map((col, index) => (
              <Area
                key={col}
                type={config.smoothCurves ? 'monotone' : 'linear'}
                dataKey={col}
                fill={COLORS[index % COLORS.length]}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={config.strokeWidth}
                fillOpacity={config.opacity}
                animationDuration={config.animation ? 1000 : 0}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={config.autoScale ? domains.y : undefined}
              scale={config.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend && <Legend />}
            {selectedColumns.map((col, index) => (
              <Bar
                key={col}
                dataKey={col}
                fill={COLORS[index % COLORS.length]}
                opacity={config.opacity}
                animationDuration={config.animation ? 1000 : 0}
              />
            ))}
          </BarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
              domain={config.autoScale ? domains.x : undefined}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={config.autoScale ? domains.y : undefined}
              scale={config.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend && <Legend />}
            {selectedColumns.map((col, index) => (
              <Scatter
                key={col}
                dataKey={col}
                fill={COLORS[index % COLORS.length]}
                opacity={config.opacity}
                animationDuration={config.animation ? 1000 : 0}
              />
            ))}
          </ScatterChart>
        );

      default:
        return <div>Type de graphique non supporté</div>;
    }
  };

  const exportChart = () => {
    // Logique d'export du graphique
    console.log('Export du graphique');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportChart}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showSettings && (
          <div className="mb-4 p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Grille</Label>
                <Switch
                  checked={config.showGrid}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showGrid: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Légende</Label>
                <Switch
                  checked={config.showLegend}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showLegend: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Courbes lisses</Label>
                <Switch
                  checked={config.smoothCurves}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, smoothCurves: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Points de données</Label>
                <Switch
                  checked={config.showDataPoints}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showDataPoints: checked }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Échelle automatique</Label>
                <Switch
                  checked={config.autoScale}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoScale: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Échelle logarithmique</Label>
                <Switch
                  checked={config.logScale}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, logScale: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Animation</Label>
                <Switch
                  checked={config.animation}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, animation: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Opacité</Label>
                <Slider
                  value={[config.opacity * 100]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, opacity: value / 100 }))}
                  max={100}
                  min={10}
                  step={10}
                />
              </div>
            </div>
          </div>
        )}
        
        <div style={{ height, width }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedChart; 