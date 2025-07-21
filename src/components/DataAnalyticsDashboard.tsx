import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Trash,
  Filter,
  Search,
  Calendar,
  Hash,
  Target,
  Zap,
  BarChart,
  Scatter,
  AreaChart,
  Gauge,
  Thermometer,
  Clock,
  Users,
  DollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Share2,
  Copy,
  FileText,
  Table,
  Columns,
  Rows,
  AlertCircle
} from 'lucide-react';
import { DataRow } from '@/types';
import { isNumericColumn, isDateColumn, getNumericValues } from '@/utils/typeUtils';
import { exportToCSV, exportToJSON, exportToExcel } from '@/utils/exportUtils';
import LoadingSpinner from './LoadingSpinner';
import RealChart from './RealChart';

interface DataAnalyticsDashboardProps {
  data: DataRow[] | null;
}

interface DataQualityMetric {
  name: string;
  value: number;
  total: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  color: string;
}

interface StatisticalSummary {
  column: string;
  type: 'numeric' | 'categorical' | 'date';
  count: number;
  missing: number;
  unique: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  topValues?: Array<{ value: string; count: number }>;
}

interface ChartConfig {
  id: string;
  type: 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'histogram' | 'boxplot' | 'heatmap';
  title: string;
  description: string;
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
  aggregation: 'none' | 'sum' | 'mean' | 'median' | 'min' | 'max' | 'count';
  timeGrouping: 'none' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  isVisible: boolean;
}

const DataAnalyticsDashboard: React.FC<DataAnalyticsDashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [showOutliers, setShowOutliers] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [charts, setCharts] = useState<ChartConfig[]>([]);

  // Colonnes disponibles
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Colonnes numériques
  const numericColumns = useMemo(() => {
    if (!data) return [];
    return columns.filter(col => isNumericColumn(data, col));
  }, [data, columns]);

  // Colonnes de dates
  const dateColumns = useMemo(() => {
    if (!data) return [];
    return columns.filter(col => isDateColumn(data, col));
  }, [data, columns]);

  // Colonnes catégorielles
  const categoricalColumns = useMemo(() => {
    if (!data) return [];
    return columns.filter(col => !isNumericColumn(data, col) && !isDateColumn(data, col));
  }, [data, columns]);

  // Métriques de qualité des données
  const dataQualityMetrics = useMemo((): DataQualityMetric[] => {
    if (!data || data.length === 0) return [];

    const totalCells = data.length * columns.length;
    let missingValues = 0;
    let duplicateRows = 0;
    let invalidValues = 0;
    let outliers = 0;

    // Calcul des valeurs manquantes
    data.forEach(row => {
      Object.values(row).forEach(value => {
        if (value === null || value === undefined || value === '') {
          missingValues++;
        }
      });
    });

    // Calcul des lignes dupliquées
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    duplicateRows = data.length - uniqueRows.size;

    // Calcul des valeurs invalides (pour les colonnes numériques)
    numericColumns.forEach(col => {
      data.forEach(row => {
        const value = row[col];
        if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
          invalidValues++;
        }
      });
    });

    // Calcul des outliers (simplifié)
    numericColumns.forEach(col => {
      const values = getNumericValues(data, col);
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        values.forEach(value => {
          if (value < lowerBound || value > upperBound) {
            outliers++;
          }
        });
      }
    });

    return [
      {
        name: 'Complétude',
        value: totalCells - missingValues,
        total: totalCells,
        percentage: ((totalCells - missingValues) / totalCells) * 100,
        status: ((totalCells - missingValues) / totalCells) * 100 > 95 ? 'excellent' : 
                ((totalCells - missingValues) / totalCells) * 100 > 80 ? 'good' : 
                ((totalCells - missingValues) / totalCells) * 100 > 60 ? 'warning' : 'critical',
        icon: CheckCircle,
        color: '#10b981'
      },
      {
        name: 'Unicité',
        value: data.length - duplicateRows,
        total: data.length,
        percentage: ((data.length - duplicateRows) / data.length) * 100,
        status: ((data.length - duplicateRows) / data.length) * 100 > 95 ? 'excellent' : 
                ((data.length - duplicateRows) / data.length) * 100 > 90 ? 'good' : 
                ((data.length - duplicateRows) / data.length) * 100 > 80 ? 'warning' : 'critical',
        icon: Database,
        color: '#3b82f6'
      },
      {
        name: 'Validité',
        value: totalCells - invalidValues,
        total: totalCells,
        percentage: ((totalCells - invalidValues) / totalCells) * 100,
        status: ((totalCells - invalidValues) / totalCells) * 100 > 98 ? 'excellent' : 
                ((totalCells - invalidValues) / totalCells) * 100 > 95 ? 'good' : 
                ((totalCells - invalidValues) / totalCells) * 100 > 90 ? 'warning' : 'critical',
        icon: AlertTriangle,
        color: '#f59e0b'
      },
      {
        name: 'Cohérence',
        value: totalCells - outliers,
        total: totalCells,
        percentage: ((totalCells - outliers) / totalCells) * 100,
        status: ((totalCells - outliers) / totalCells) * 100 > 95 ? 'excellent' : 
                ((totalCells - outliers) / totalCells) * 100 > 85 ? 'good' : 
                ((totalCells - outliers) / totalCells) * 100 > 70 ? 'warning' : 'critical',
        icon: Activity,
        color: '#ef4444'
      }
    ];
  }, [data, columns, numericColumns]);

  // Résumé statistique des colonnes
  const columnStats = useMemo((): StatisticalSummary[] => {
    if (!data || data.length === 0) return [];

    return columns.map(col => {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = new Set(values);
      const missing = data.length - values.length;

      const stats: StatisticalSummary = {
        column: col,
        type: isNumericColumn(data, col) ? 'numeric' : isDateColumn(data, col) ? 'date' : 'categorical',
        count: values.length,
        missing,
        unique: uniqueValues.size
      };

      if (isNumericColumn(data, col)) {
        const numericValues = getNumericValues(data, col);
        if (numericValues.length > 0) {
          const sorted = numericValues.sort((a, b) => a - b);
          stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          stats.median = sorted[Math.floor(sorted.length / 2)];
          stats.std = Math.sqrt(numericValues.reduce((a, b) => a + Math.pow(b - stats.mean!, 2), 0) / numericValues.length);
          stats.min = Math.min(...numericValues);
          stats.max = Math.max(...numericValues);
        }
      } else if (isDateColumn(data, col)) {
        // Statistiques pour les dates
        const dateValues = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (dateValues.length > 0) {
          const timestamps = dateValues.map(d => d.getTime());
          stats.min = Math.min(...timestamps);
          stats.max = Math.max(...timestamps);
        }
      } else {
        // Top valeurs pour les colonnes catégorielles
        const valueCounts = new Map<string, number>();
        values.forEach(value => {
          valueCounts.set(String(value), (valueCounts.get(String(value)) || 0) + 1);
        });
        stats.topValues = Array.from(valueCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }));
      }

      return stats;
    });
  }, [data, columns]);

  // Créer des graphiques par défaut
  useEffect(() => {
    if (data && data.length > 0 && charts.length === 0) {
      const defaultCharts: ChartConfig[] = [];

      // Graphique 1: Distribution des données numériques
      if (numericColumns.length > 0) {
        defaultCharts.push({
          id: 'chart-1',
          type: 'histogram',
          title: 'Distribution des Variables Numériques',
          description: 'Analyse de la distribution des données numériques',
          xAxis: numericColumns[0],
          yAxis: 'count',
          selectedColumns: [numericColumns[0]],
          colorScheme: 'ocean',
          showGrid: true,
          showLegend: false,
          smoothCurves: false,
          showDataPoints: false,
          logScale: false,
          opacity: 0.8,
          strokeWidth: 2,
          fillOpacity: 0.6,
          aggregation: 'count',
          timeGrouping: 'none',
          isVisible: true
        });
      }

      // Graphique 2: Corrélations
      if (numericColumns.length >= 2) {
        defaultCharts.push({
          id: 'chart-2',
          type: 'scatter',
          title: 'Analyse des Corrélations',
          description: 'Corrélation entre variables numériques',
          xAxis: numericColumns[0],
          yAxis: numericColumns[1],
          selectedColumns: numericColumns.slice(0, 2),
          colorScheme: 'forest',
          showGrid: true,
          showLegend: true,
          smoothCurves: false,
          showDataPoints: true,
          logScale: false,
          opacity: 0.6,
          strokeWidth: 1,
          fillOpacity: 0.4,
          aggregation: 'none',
          timeGrouping: 'none',
          isVisible: true
        });
      }

      // Graphique 3: Évolution temporelle
      if (dateColumns.length > 0 && numericColumns.length > 0) {
        defaultCharts.push({
          id: 'chart-3',
          type: 'line',
          title: 'Évolution Temporelle',
          description: 'Tendance des données dans le temps',
          xAxis: dateColumns[0],
          yAxis: numericColumns[0],
          selectedColumns: numericColumns.slice(0, 2),
          colorScheme: 'sunset',
          showGrid: true,
          showLegend: true,
          smoothCurves: true,
          showDataPoints: false,
          logScale: false,
          opacity: 0.8,
          strokeWidth: 2,
          fillOpacity: 0.3,
          aggregation: 'mean',
          timeGrouping: 'month',
          isVisible: true
        });
      }

      setCharts(defaultCharts);
    }
  }, [data, numericColumns, dateColumns, charts.length]);

  // Exporter les données
  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    if (!data) return;
    
    setLoading(true);
    try {
      switch (format) {
        case 'csv':
          exportToCSV(data, 'data-analytics.csv');
          break;
        case 'json':
          exportToJSON(data, 'data-analytics.json');
          break;
        case 'excel':
          await exportToExcel(data, 'data-analytics.xlsx');
          break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard d'Analyse des Données
          </CardTitle>
          <CardDescription>
            Aucune donnée disponible pour l'analyse
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lignes</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {columns.length} colonnes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colonnes Numériques</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numericColumns.length}</div>
            <p className="text-xs text-muted-foreground">
              {((numericColumns.length / columns.length) * 100).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colonnes Catégorielles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoricalColumns.length}</div>
            <p className="text-xs text-muted-foreground">
              {((categoricalColumns.length / columns.length) * 100).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colonnes Temporelles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dateColumns.length}</div>
            <p className="text-xs text-muted-foreground">
              {dateColumns.length > 0 ? 'Séries temporelles' : 'Aucune date'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de qualité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Qualité des Données
          </CardTitle>
          <CardDescription>
            Évaluation de la qualité et de la fiabilité des données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataQualityMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${metric.status === 'excellent' ? 'text-green-500' : 
                                       metric.status === 'good' ? 'text-blue-500' : 
                                       metric.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <Badge variant={
                      metric.status === 'excellent' ? 'default' : 
                      metric.status === 'good' ? 'secondary' : 
                      metric.status === 'warning' ? 'outline' : 'destructive'
                    }>
                      {metric.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={metric.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {metric.value.toLocaleString()} / {metric.total.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          <TabsTrigger value="visualizations">Visualisations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique de distribution */}
            {charts.filter(c => c.type === 'histogram').map(chart => (
              <Card key={chart.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{chart.title}</CardTitle>
                  <CardDescription>{chart.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RealChart data={data} chartConfig={chart} />
                </CardContent>
              </Card>
            ))}

            {/* Graphique de corrélations */}
            {charts.filter(c => c.type === 'scatter').map(chart => (
              <Card key={chart.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{chart.title}</CardTitle>
                  <CardDescription>{chart.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RealChart data={data} chartConfig={chart} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Statistiques détaillées */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Statistiques par Colonne
              </CardTitle>
              <CardDescription>
                Analyse détaillée de chaque variable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {columnStats.map((stat) => (
                  <div key={stat.column} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{stat.column}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {stat.type === 'numeric' ? 'Numérique' : 
                           stat.type === 'date' ? 'Date' : 'Catégoriel'}
                        </Badge>
                        <Badge variant="secondary">
                          {stat.count} valeurs
                        </Badge>
                        {stat.missing > 0 && (
                          <Badge variant="destructive">
                            {stat.missing} manquantes
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Complétude:</span>
                        <div className="font-medium">
                          {((stat.count / (stat.count + stat.missing)) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valeurs uniques:</span>
                        <div className="font-medium">{stat.unique}</div>
                      </div>
                      
                      {stat.type === 'numeric' && stat.mean !== undefined && (
                        <>
                          <div>
                            <span className="text-muted-foreground">Moyenne:</span>
                            <div className="font-medium">{stat.mean.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Écart-type:</span>
                            <div className="font-medium">{stat.std?.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min:</span>
                            <div className="font-medium">{stat.min?.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max:</span>
                            <div className="font-medium">{stat.max?.toFixed(2)}</div>
                          </div>
                        </>
                      )}
                      
                      {stat.type === 'categorical' && stat.topValues && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Valeurs principales:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {stat.topValues.slice(0, 3).map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item.value} ({item.count})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visualisations */}
        <TabsContent value="visualizations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Visualisations Avancées</h3>
              <p className="text-muted-foreground">
                Graphiques interactifs pour l'analyse des données
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <FileText className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map((chart) => (
              <Card key={chart.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{chart.title}</CardTitle>
                  <CardDescription>{chart.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RealChart data={data} chartConfig={chart} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Insights Automatiques
              </CardTitle>
              <CardDescription>
                Découvertes automatiques et recommandations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Insights de qualité */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Qualité des Données
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {dataQualityMetrics.map(metric => {
                      if (metric.status === 'critical' || metric.status === 'warning') {
                        return (
                          <li key={metric.name} className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span>{metric.name}: {metric.percentage.toFixed(1)}% - Nécessite attention</span>
                          </li>
                        );
                      }
                      return null;
                    })}
                    {dataQualityMetrics.every(m => m.status === 'excellent' || m.status === 'good') && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Excellente qualité des données</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Insights de corrélation */}
                {numericColumns.length >= 2 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Corrélations Détectées
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {numericColumns.length} variables numériques disponibles pour l'analyse de corrélation
                    </p>
                  </div>
                )}

                {/* Insights temporels */}
                {dateColumns.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      Séries Temporelles
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {dateColumns.length} colonne(s) temporelle(s) détectée(s) - Analyse de tendances possible
                    </p>
                  </div>
                )}

                {/* Recommandations ML */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Recommandations Machine Learning
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {numericColumns.length >= 2 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Régression possible avec {numericColumns.length} variables numériques</span>
                      </li>
                    )}
                    {categoricalColumns.length > 0 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Classification possible avec {categoricalColumns.length} variables catégorielles</span>
                      </li>
                    )}
                    {dateColumns.length > 0 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Prévision temporelle possible</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex justify-center">
          <LoadingSpinner text="Export en cours..." />
        </div>
      )}
    </div>
  );
};

export default DataAnalyticsDashboard; 