import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Brush
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Settings,
  Play,
  Save,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { DataSet } from '@/types';

interface EnhancedDataVisualizationProps {
  dataSet: DataSet | null;
}

interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'pie' | 'area' | 'composed';
  xAxis: string;
  yAxis: string;
  series: string[];
  isTimeSeries: boolean;
  timeColumn?: string;
  aggregation?: 'sum' | 'mean' | 'count' | 'min' | 'max';
  timeGrouping?: 'day' | 'week' | 'month' | 'year';
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ff8042', '#00ff00'];

const EnhancedDataVisualization: React.FC<EnhancedDataVisualizationProps> = ({ dataSet }) => {
  const [activeTab, setActiveTab] = useState('line');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'line',
    xAxis: '',
    yAxis: '',
    series: [],
    isTimeSeries: false
  });
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Analyser les colonnes pour détecter les types
  const columnAnalysis = useMemo(() => {
    if (!dataSet?.data || !dataSet?.columns) return {};

    const analysis: Record<string, { type: 'numeric' | 'categorical' | 'datetime', sampleValues: any[] }> = {};
    
    dataSet.columns.forEach((column, colIndex) => {
      const values: any[] = [];
      const sampleValues: any[] = [];
      
      dataSet.data.slice(0, 100).forEach(row => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }
        
        if (value !== null && value !== undefined && value !== '') {
          values.push(value);
          if (sampleValues.length < 5) {
            sampleValues.push(value);
          }
        }
      });

      // Détecter le type de colonne
      let type: 'numeric' | 'categorical' | 'datetime' = 'categorical';
      
      if (values.length > 0) {
        const numericCount = values.filter(v => {
          if (typeof v === 'number' && !isNaN(v)) return true;
          if (typeof v === 'string' && !isNaN(Number(v))) return true;
          return false;
        }).length;
        const dateCount = values.filter(v => {
          if (typeof v === 'string') {
            const date = new Date(v);
            return !isNaN(date.getTime());
          }
          return false;
        }).length;
        
        if (numericCount / values.length > 0.8) {
          type = 'numeric';
        } else if (dateCount / values.length > 0.5) {
          type = 'datetime';
        }
      }

      analysis[column] = { type, sampleValues };
    });

    return analysis;
  }, [dataSet]);

  // Détecter automatiquement les séries temporelles
  const timeSeriesDetection = useMemo(() => {
    if (!dataSet?.columns) return null;

    const datetimeColumns = dataSet.columns.filter(col => 
      columnAnalysis[col]?.type === 'datetime'
    );

    if (datetimeColumns.length === 0) return null;

    // Chercher des colonnes numériques pour les valeurs
    const numericColumns = dataSet.columns.filter(col => 
      columnAnalysis[col]?.type === 'numeric'
    );

    if (numericColumns.length === 0) return null;

    return {
      timeColumn: datetimeColumns[0],
      valueColumns: numericColumns.slice(0, 3) // Prendre les 3 premières colonnes numériques
    };
  }, [dataSet, columnAnalysis]);

  // Initialiser la configuration automatiquement
  useEffect(() => {
    if (!dataSet?.columns) return;

    const numericColumns = dataSet.columns.filter(col => 
      columnAnalysis[col]?.type === 'numeric'
    );
    const categoricalColumns = dataSet.columns.filter(col => 
      columnAnalysis[col]?.type === 'categorical'
    );
    const datetimeColumns = dataSet.columns.filter(col => 
      columnAnalysis[col]?.type === 'datetime'
    );

    let newConfig: ChartConfig = {
      type: 'line',
      xAxis: '',
      yAxis: '',
      series: [],
      isTimeSeries: false
    };

    // Si c'est une série temporelle, configurer automatiquement
    if (timeSeriesDetection) {
      newConfig = {
        type: 'line',
        xAxis: timeSeriesDetection.timeColumn,
        yAxis: timeSeriesDetection.valueColumns[0],
        series: timeSeriesDetection.valueColumns,
        isTimeSeries: true,
        timeColumn: timeSeriesDetection.timeColumn,
        aggregation: 'mean',
        timeGrouping: 'day'
      };
    } else {
      // Configuration par défaut
      if (datetimeColumns.length > 0 && numericColumns.length > 0) {
        // Si on a des colonnes de date, créer une série temporelle
        newConfig = {
          type: 'line',
          xAxis: datetimeColumns[0],
          yAxis: numericColumns[0],
          series: [numericColumns[0]],
          isTimeSeries: true,
          timeColumn: datetimeColumns[0],
          aggregation: 'mean',
          timeGrouping: 'day'
        };
      } else if (categoricalColumns.length > 0 && numericColumns.length > 0) {
        newConfig = {
          type: 'bar',
          xAxis: categoricalColumns[0],
          yAxis: numericColumns[0],
          series: [numericColumns[0]],
          isTimeSeries: false
        };
      } else if (numericColumns.length >= 2) {
        newConfig = {
          type: 'scatter',
          xAxis: numericColumns[0],
          yAxis: numericColumns[1],
          series: [numericColumns[1]],
          isTimeSeries: false
        };
      } else if (numericColumns.length === 1) {
        // Si on n'a qu'une colonne numérique, utiliser l'index comme axe X
        newConfig = {
          type: 'line',
          xAxis: 'index',
          yAxis: numericColumns[0],
          series: [numericColumns[0]],
          isTimeSeries: false
        };
      } else if (numericColumns.length === 0) {
        // Si pas de colonnes numériques, créer des données d'index
        newConfig = {
          type: 'line',
          xAxis: 'index',
          yAxis: 'count',
          series: ['count'],
          isTimeSeries: false
        };
      }
    }

    setChartConfig(newConfig);
  }, [dataSet, columnAnalysis, timeSeriesDetection]);

  // Debug: Afficher les informations de configuration
  useEffect(() => {
    console.log('Chart Config:', chartConfig);
    console.log('Processed Data Length:', processedData.length);
    console.log('DataSet:', dataSet);
  }, [chartConfig, processedData, dataSet]);

  // Traiter les données selon la configuration
  const processDataForChart = useMemo(() => {
    if (!dataSet?.data || !chartConfig.xAxis || !chartConfig.yAxis) {
      setProcessedData([]);
      return [];
    }

    try {
      let processed: any[] = [];

      if (chartConfig.isTimeSeries && chartConfig.timeColumn) {
        // Traitement spécial pour les séries temporelles
        processed = processTimeSeriesData();
      } else {
        // Traitement standard
        processed = processStandardData();
      }

      setProcessedData(processed);
      return processed;
    } catch (error) {
      console.error('Erreur lors du traitement des données:', error);
      setProcessedData([]);
      return [];
    }
  }, [dataSet, chartConfig, chartConfig.xAxis, chartConfig.yAxis, chartConfig.isTimeSeries, chartConfig.timeColumn, chartConfig.series]);

  const processTimeSeriesData = () => {
    if (!dataSet?.data || !chartConfig.timeColumn) return [];

    const timeColIndex = dataSet.columns?.indexOf(chartConfig.timeColumn) || 0;
    const valueColIndices = chartConfig.series.map(col => 
      dataSet.columns?.indexOf(col) || 0
    );

    // Collecter et trier les données par date
    const timeData: Record<string, Record<string, number[]>> = {};

    dataSet.data.forEach(row => {
      let timeValue;
      if (Array.isArray(row)) {
        timeValue = row[timeColIndex];
      } else if (typeof row === 'object' && row !== null) {
        timeValue = row[chartConfig.timeColumn!];
      } else {
        timeValue = row;
      }

      if (!timeValue) return;

      // Normaliser la date selon le groupement
      let normalizedTime = timeValue;
      if (typeof timeValue === 'string') {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          switch (chartConfig.timeGrouping) {
            case 'day':
              normalizedTime = date.toISOString().split('T')[0];
              break;
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              normalizedTime = weekStart.toISOString().split('T')[0];
              break;
            case 'month':
              normalizedTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              break;
            case 'year':
              normalizedTime = date.getFullYear().toString();
              break;
          }
        }
      }

      if (!timeData[normalizedTime]) {
        timeData[normalizedTime] = {};
        chartConfig.series.forEach(col => {
          timeData[normalizedTime][col] = [];
        });
      }

      // Collecter les valeurs pour chaque série
      valueColIndices.forEach((colIndex, seriesIndex) => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[chartConfig.series[seriesIndex]];
        } else {
          value = row;
        }

        if (typeof value === 'number' && !isNaN(value)) {
          timeData[normalizedTime][chartConfig.series[seriesIndex]].push(value);
        }
      });
    });

    // Agréger les données
    const aggregatedData = Object.entries(timeData).map(([time, seriesData]) => {
      const result: any = { time };
      
      chartConfig.series.forEach(series => {
        const values = seriesData[series];
        if (values.length > 0) {
          let aggregatedValue;
          switch (chartConfig.aggregation) {
            case 'sum':
              aggregatedValue = values.reduce((a, b) => a + b, 0);
              break;
            case 'mean':
              aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case 'count':
              aggregatedValue = values.length;
              break;
            case 'min':
              aggregatedValue = Math.min(...values);
              break;
            case 'max':
              aggregatedValue = Math.max(...values);
              break;
            default:
              aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          }
          result[series] = aggregatedValue;
        } else {
          result[series] = 0;
        }
      });

      return result;
    });

    // Trier par date
    return aggregatedData.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const processStandardData = () => {
    if (!dataSet?.data) return [];

    console.log('Processing standard data with config:', chartConfig);
    console.log('DataSet columns:', dataSet.columns);
    console.log('DataSet data sample:', dataSet.data.slice(0, 3));

    // Gérer le cas spécial où l'axe X est 'index'
    if (chartConfig.xAxis === 'index') {
      if (chartConfig.yAxis === 'count') {
        // Créer des données d'index avec compteur
        return dataSet.data.slice(0, 50).map((row, index) => ({
          index,
          count: index + 1,
          value: Math.random() * 100 + index * 2
        }));
      } else {
        // Utiliser l'index comme axe X et une colonne numérique comme axe Y
        const yColIndex = dataSet.columns?.indexOf(chartConfig.yAxis) || 0;
        
        return dataSet.data.slice(0, 50).map((row, index) => {
          let yValue;
          
          if (Array.isArray(row)) {
            yValue = row[yColIndex];
          } else if (typeof row === 'object' && row !== null) {
            yValue = row[chartConfig.yAxis];
          } else {
            yValue = row;
          }

          const yNum = typeof yValue === 'string' ? Number(yValue) : yValue;

          return {
            index,
            [chartConfig.yAxis]: yNum,
            ...chartConfig.series.reduce((acc, series) => {
              const seriesIndex = dataSet.columns?.indexOf(series) || 0;
              let seriesValue;
              if (Array.isArray(row)) {
                seriesValue = row[seriesIndex];
              } else if (typeof row === 'object' && row !== null) {
                seriesValue = row[series];
              } else {
                seriesValue = row;
              }
              const seriesNum = typeof seriesValue === 'string' ? Number(seriesValue) : seriesValue;
              acc[series] = seriesNum;
              return acc;
            }, {} as Record<string, any>)
          };
        }).filter(item => {
          const yValid = item[chartConfig.yAxis] !== null && 
                         item[chartConfig.yAxis] !== undefined &&
                         item[chartConfig.yAxis] !== '' &&
                         !isNaN(item[chartConfig.yAxis]);
          return yValid;
        });
      }
    }

    // Traitement standard
    const xColIndex = dataSet.columns?.indexOf(chartConfig.xAxis) || 0;
    const yColIndex = dataSet.columns?.indexOf(chartConfig.yAxis) || 0;

    const processed = dataSet.data.map((row, index) => {
      let xValue, yValue;
      
      if (Array.isArray(row)) {
        xValue = row[xColIndex];
        yValue = row[yColIndex];
      } else if (typeof row === 'object' && row !== null) {
        xValue = row[chartConfig.xAxis];
        yValue = row[chartConfig.yAxis];
      } else {
        xValue = row;
        yValue = row;
      }

      // Convertir en nombres si possible
      const xNum = typeof xValue === 'string' ? Number(xValue) : xValue;
      const yNum = typeof yValue === 'string' ? Number(yValue) : yValue;

      const result = {
        index,
        [chartConfig.xAxis]: xNum,
        [chartConfig.yAxis]: yNum,
        ...chartConfig.series.reduce((acc, series) => {
          const seriesIndex = dataSet.columns?.indexOf(series) || 0;
          let seriesValue;
          if (Array.isArray(row)) {
            seriesValue = row[seriesIndex];
          } else if (typeof row === 'object' && row !== null) {
            seriesValue = row[series];
          } else {
            seriesValue = row;
          }
          // Convertir en nombre si possible
          const seriesNum = typeof seriesValue === 'string' ? Number(seriesValue) : seriesValue;
          acc[series] = seriesNum;
          return acc;
        }, {} as Record<string, any>)
      };

      // Debug pour les premières lignes
      if (index < 3) {
        console.log(`Row ${index}:`, result);
      }

      return result;
    }).filter(item => {
      const xValid = item[chartConfig.xAxis] !== null && 
                     item[chartConfig.xAxis] !== undefined && 
                     item[chartConfig.xAxis] !== '' &&
                     !isNaN(item[chartConfig.xAxis]);
      const yValid = item[chartConfig.yAxis] !== null && 
                     item[chartConfig.yAxis] !== undefined &&
                     item[chartConfig.yAxis] !== '' &&
                     !isNaN(item[chartConfig.yAxis]);
      
      const isValid = xValid && yValid;
      
      if (!isValid) {
        console.log('Filtered out item:', item);
      }
      
      return isValid;
    });

    console.log('Processed data length:', processed.length);
    console.log('Processed data sample:', processed.slice(0, 3));
    
    return processed;
  };

  const renderChart = () => {
    console.log('Rendering chart with data:', processedData);
    
    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune donnée à afficher</p>
            <p className="text-sm">
              {!chartConfig.xAxis || !chartConfig.yAxis 
                ? "Configurez les axes X et Y pour visualiser vos données"
                : `Données filtrées: ${processedData.length} lignes valides`
              }
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Config: X={chartConfig.xAxis}, Y={chartConfig.yAxis}, Series={chartConfig.series.join(', ')}
            </p>
          </div>
        </div>
      );
    }

    const xAxisKey = chartConfig.isTimeSeries ? 'time' : chartConfig.xAxis;
    const yAxisKey = chartConfig.yAxis;
    
    console.log('Chart keys:', { xAxisKey, yAxisKey, series: chartConfig.series });
    console.log('First data point:', processedData[0]);

    switch (chartConfig.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={Math.ceil(processedData.length / 20)}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ 
                  value: yAxisKey, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  return [value, name];
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Brush dataKey={xAxisKey} height={30} stroke="#8884d8" />
              
              {chartConfig.series.length > 0 ? (
                chartConfig.series.map((series, index) => (
                  <Line
                    key={series}
                    type="monotone"
                    dataKey={series}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={series}
                  />
                ))
              ) : (
                // Si pas de séries spécifiques, utiliser l'axe Y
                <Line
                  type="monotone"
                  dataKey={yAxisKey}
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={yAxisKey}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.series.map((series, index) => (
                <Bar
                  key={series}
                  dataKey={series}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                name={chartConfig.xAxis}
              />
              <YAxis 
                dataKey={yAxisKey} 
                tick={{ fontSize: 12 }}
                name={chartConfig.yAxis}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              {chartConfig.series.map((series, index) => (
                <Scatter
                  key={series}
                  dataKey={series}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.series.map((series, index) => (
                <Area
                  key={series}
                  type="monotone"
                  dataKey={series}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.series.map((series, index) => (
                <Bar
                  key={series}
                  dataKey={series}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
              {chartConfig.series.slice(0, 1).map((series, index) => (
                <Line
                  key={`line-${series}`}
                  type="monotone"
                  dataKey={series}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (!dataSet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Visualisation des Données
          </CardTitle>
          <CardDescription>
            Aucune donnée disponible pour la visualisation
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const numericColumns = dataSet.columns?.filter(col => 
    columnAnalysis[col]?.type === 'numeric'
  ) || [];
  const categoricalColumns = dataSet.columns?.filter(col => 
    columnAnalysis[col]?.type === 'categorical'
  ) || [];
  const datetimeColumns = dataSet.columns?.filter(col => 
    columnAnalysis[col]?.type === 'datetime'
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Visualisation des Données
          {timeSeriesDetection && (
            <Badge variant="secondary" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              Série Temporelle Détectée
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Créez des visualisations interactives de vos données
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panneau de configuration */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="line" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Ligne
                </TabsTrigger>
                <TabsTrigger value="bar" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Barres
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="line" className="space-y-4 mt-4">
                <div>
                  <Label>Type de graphique</Label>
                  <Select 
                    value={chartConfig.type} 
                    onValueChange={(value) => setChartConfig(prev => ({
                      ...prev,
                      type: value as ChartConfig['type']
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Ligne</SelectItem>
                      <SelectItem value="area">Aire</SelectItem>
                      <SelectItem value="composed">Composé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="bar" className="space-y-4 mt-4">
                <div>
                  <Label>Type de graphique</Label>
                  <Select 
                    value={chartConfig.type} 
                    onValueChange={(value) => setChartConfig(prev => ({
                      ...prev,
                      type: value as ChartConfig['type']
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Barres</SelectItem>
                      <SelectItem value="scatter">Nuage de points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            {/* Configuration des axes */}
            <div className="space-y-4">
              <div>
                <Label>Axe X</Label>
                <Select 
                  value={chartConfig.xAxis} 
                  onValueChange={(value) => setChartConfig(prev => ({
                    ...prev,
                    xAxis: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'axe X" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartConfig.isTimeSeries ? (
                      <SelectItem value={chartConfig.timeColumn || ''}>
                        {chartConfig.timeColumn} (Temps)
                      </SelectItem>
                    ) : (
                      dataSet.columns?.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column} ({columnAnalysis[column]?.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Axe Y</Label>
                <Select 
                  value={chartConfig.yAxis} 
                  onValueChange={(value) => setChartConfig(prev => ({
                    ...prev,
                    yAxis: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'axe Y" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column} (Numérique)
                      </SelectItem>
                    ))}
                    {categoricalColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column} (Catégoriel)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuration spéciale pour les séries temporelles */}
              {chartConfig.isTimeSeries && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <Label className="text-blue-800">Configuration Série Temporelle</Label>
                  </div>
                  
                  <div>
                    <Label>Agrégation</Label>
                    <Select 
                      value={chartConfig.aggregation || 'mean'} 
                      onValueChange={(value) => setChartConfig(prev => ({
                        ...prev,
                        aggregation: value as ChartConfig['aggregation']
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">Somme</SelectItem>
                        <SelectItem value="mean">Moyenne</SelectItem>
                        <SelectItem value="count">Comptage</SelectItem>
                        <SelectItem value="min">Minimum</SelectItem>
                        <SelectItem value="max">Maximum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Groupement temporel</Label>
                    <Select 
                      value={chartConfig.timeGrouping || 'day'} 
                      onValueChange={(value) => setChartConfig(prev => ({
                        ...prev,
                        timeGrouping: value as ChartConfig['timeGrouping']
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Jour</SelectItem>
                        <SelectItem value="week">Semaine</SelectItem>
                        <SelectItem value="month">Mois</SelectItem>
                        <SelectItem value="year">Année</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Sélection des séries */}
              <div>
                <Label>Séries à afficher</Label>
                <div className="space-y-2 mt-2">
                  {numericColumns.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`series-${column}`}
                        checked={chartConfig.series.includes(column)}
                        onChange={() => {
                          setChartConfig(prev => ({
                            ...prev,
                            series: prev.series.includes(column)
                              ? prev.series.filter(s => s !== column)
                              : [...prev.series, column]
                          }));
                        }}
                      />
                      <Label htmlFor={`series-${column}`} className="text-sm">
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (timeSeriesDetection) {
                      setChartConfig({
                        type: 'line',
                        xAxis: timeSeriesDetection.timeColumn,
                        yAxis: timeSeriesDetection.valueColumns[0],
                        series: timeSeriesDetection.valueColumns,
                        isTimeSeries: true,
                        timeColumn: timeSeriesDetection.timeColumn,
                        aggregation: 'mean',
                        timeGrouping: 'day'
                      });
                    }
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-config
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChartConfig({
                      type: 'line',
                      xAxis: '',
                      yAxis: '',
                      series: [],
                      isTimeSeries: false
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Zone de visualisation */}
          <div className="lg:col-span-3">
            {/* Debug Panel */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-xs">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Config:</strong>
                  <div>X: {chartConfig.xAxis || 'Non défini'}</div>
                  <div>Y: {chartConfig.yAxis || 'Non défini'}</div>
                  <div>Series: {chartConfig.series.join(', ') || 'Aucune'}</div>
                  <div>Type: {chartConfig.type}</div>
                  <div>TimeSeries: {chartConfig.isTimeSeries ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <strong>Data:</strong>
                  <div>Total: {dataSet?.data?.length || 0}</div>
                  <div>Processed: {processedData.length}</div>
                  <div>Columns: {dataSet?.columns?.join(', ') || 'Aucune'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              {isProcessing ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  Traitement des données...
                </div>
              ) : (
                renderChart()
              )}
            </div>
            
            {/* Statistiques */}
            {processedData.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center bg-blue-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-blue-600">
                    {processedData.length}
                  </div>
                  <div className="text-sm text-blue-500">Points de données</div>
                </div>
                <div className="text-center bg-green-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-green-600">
                    {chartConfig.series.length}
                  </div>
                  <div className="text-sm text-green-500">Séries affichées</div>
                </div>
                <div className="text-center bg-purple-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-purple-600">
                    {chartConfig.isTimeSeries ? 'Temporel' : 'Standard'}
                  </div>
                  <div className="text-sm text-purple-500">Type de graphique</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedDataVisualization; 