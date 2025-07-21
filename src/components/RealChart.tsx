import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, PieChart, Pie, Cell,
  Legend, Brush, ReferenceLine, ReferenceArea
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataRow } from '@/types';
import { isNumericColumn, isDateColumn, getNumericValues } from '@/utils/typeUtils';
import HistogramChart from './HistogramChart';

interface RealChartProps {
  data: DataRow[];
  chartConfig: {
    type: string;
    title: string;
    xAxis: string;
    yAxis: string;
    selectedColumns: string[];
    colorScheme: string;
    showGrid: boolean;
    showLegend: boolean;
    smoothCurves: boolean;
    showDataPoints: boolean;
    logScale: boolean;
    opacity: number;
    strokeWidth: number;
    fillOpacity: number;
    showTrendline: boolean;
    aggregation: string;
  };
}

const COLOR_SCHEMES = {
  default: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE'],
  ocean: ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
  forest: ['#064e3b', '#047857', '#059669', '#10b981', '#34d399'],
  sunset: ['#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5'],
  pastel: ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#fbbf24'],
  monochrome: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
};

const RealChart: React.FC<RealChartProps> = ({ data, chartConfig }) => {
  // Traitement des données
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let processed = data.map((row, index) => {
      const processedRow: any = { index };
      
      // Traitement de l'axe X
      if (isDateColumn(data, chartConfig.xAxis)) {
        const dateValue = new Date(row[chartConfig.xAxis]);
        processedRow.x = isNaN(dateValue.getTime()) ? row[chartConfig.xAxis] : dateValue.getTime();
      } else if (isNumericColumn(data, chartConfig.xAxis)) {
        processedRow.x = parseFloat(row[chartConfig.xAxis]) || 0;
      } else {
        processedRow.x = row[chartConfig.xAxis];
      }

      // Traitement des colonnes Y
      chartConfig.selectedColumns.forEach((col, colIndex) => {
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
    if (isNumericColumn(data, chartConfig.xAxis) || isDateColumn(data, chartConfig.xAxis)) {
      processed.sort((a, b) => a.x - b.x);
    }

    return processed;
  }, [data, chartConfig]);

  // Calcul des domaines
  const domains = useMemo(() => {
    if (!processedData.length) return { x: [0, 100], y: [0, 100] };

    const xValues = processedData.map(d => d.x).filter(v => v !== null && v !== undefined);
    const yValues = chartConfig.selectedColumns.flatMap(col => 
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
  }, [processedData, chartConfig.selectedColumns]);

  // Formatage des axes
  const formatXAxis = (tickItem: any) => {
    if (isDateColumn(data, chartConfig.xAxis)) {
      return new Date(tickItem).toLocaleDateString('fr-FR', {
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
    if (chartConfig.logScale) {
      return Math.pow(10, tickItem).toLocaleString('fr-FR');
    }
    return tickItem.toLocaleString('fr-FR');
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${chartConfig.xAxis}: ${formatXAxis(label)}`}</p>
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
    const colors = COLOR_SCHEMES[chartConfig.colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default;
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

    switch (chartConfig.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
              domain={domains.x}
              type={isDateColumn(data, chartConfig.xAxis) ? 'number' : 'category'}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={domains.y}
              scale={chartConfig.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.showLegend && <Legend />}
            {chartConfig.selectedColumns.map((col, index) => (
              <Line
                key={col}
                type={chartConfig.smoothCurves ? 'monotone' : 'linear'}
                dataKey={col}
                stroke={colors[index % colors.length]}
                strokeWidth={chartConfig.strokeWidth}
                dot={chartConfig.showDataPoints ? { r: 4 } : false}
                activeDot={{ r: 6 }}
                opacity={chartConfig.opacity}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
              domain={domains.x}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={domains.y}
              scale={chartConfig.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.showLegend && <Legend />}
            {chartConfig.selectedColumns.map((col, index) => (
              <Area
                key={col}
                type={chartConfig.smoothCurves ? 'monotone' : 'linear'}
                dataKey={col}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                strokeWidth={chartConfig.strokeWidth}
                fillOpacity={chartConfig.fillOpacity}
                opacity={chartConfig.opacity}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={domains.y}
              scale={chartConfig.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.showLegend && <Legend />}
            {chartConfig.selectedColumns.map((col, index) => (
              <Bar
                key={col}
                dataKey={col}
                fill={colors[index % colors.length]}
                opacity={chartConfig.opacity}
              />
            ))}
          </BarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="x" 
              {...axisProps}
              tickFormatter={formatXAxis}
              domain={domains.x}
            />
            <YAxis 
              {...axisProps}
              tickFormatter={formatYAxis}
              domain={domains.y}
              scale={chartConfig.logScale ? 'log' : 'linear'}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.showLegend && <Legend />}
            {chartConfig.selectedColumns.map((col, index) => (
              <Scatter
                key={col}
                dataKey={col}
                fill={colors[index % colors.length]}
                opacity={chartConfig.opacity}
              />
            ))}
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={processedData}
              dataKey={chartConfig.selectedColumns[0]}
              nameKey="x"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            {chartConfig.showLegend && <Legend />}
          </PieChart>
        );

      case 'histogram':
        return (
          <HistogramChart
            data={data}
            column={chartConfig.xAxis}
            title={chartConfig.title}
            description={chartConfig.description || ''}
            colorScheme={chartConfig.colorScheme}
            showGrid={chartConfig.showGrid}
            opacity={chartConfig.opacity}
            fillOpacity={chartConfig.fillOpacity}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Type de graphique non supporté</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{chartConfig.title}</CardTitle>
            <Badge variant="outline">{chartConfig.type}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {processedData.length} points
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealChart; 