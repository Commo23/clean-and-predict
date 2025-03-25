import { useState, useMemo, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DataTable from './DataTable';
import { Plus, Trash, Download, Settings, PaintBucket, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import DataCleaningDialog from './data-cleaning/DataCleaningDialog';

interface DataVisualizationProps {
  data: any[] | null;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'];
const CHART_TYPES = [
  { type: 'line', name: 'Ligne', icon: '📈' },
  { type: 'area', name: 'Aire', icon: '📊' },
  { type: 'bar', name: 'Barres', icon: '📊' },
  { type: 'scatter', name: 'Nuage de points', icon: '🔍' },
  { type: 'composed', name: 'Composé', icon: '🎭' },
  { type: 'pie', name: 'Camembert', icon: '🍩' },
  { type: 'radar', name: 'Radar', icon: '🌐' },
  { type: 'radialBar', name: 'Jauge radiale', icon: '⏱️' },
  { type: 'treemap', name: 'Carte arborescente', icon: '🗂️' }
];

const DataVisualization = ({ data: initialData }: DataVisualizationProps) => {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [dashboardMode, setDashboardMode] = useState<'auto' | 'grid'>('auto');
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [animatedCharts, setAnimatedCharts] = useState(true);
  const [smoothCurves, setSmoothCurves] = useState(true);
  const [chartOpacity, setChartOpacity] = useState(0.8);
  const [colorPalette, setColorPalette] = useState('default');
  
  const [charts, setCharts] = useState([
    {
      id: 1,
      chartType: 'line',
      xAxis: '',
      selectedColumns: [] as string[],
      isTimeSeries: false,
      title: 'Graphique 1',
      gridArea: 'auto',
      showLegend: true,
      stacked: false,
      normalized: false,
      gridLines: true,
      colorScheme: 'default'
    }
  ]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simuler une actualisation des données (dans un cas réel, on récupérerait de nouvelles données)
        toast({
          title: "Rafraîchissement automatique",
          description: "Les données ont été rafraîchies",
        });
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, toast]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const getColorScheme = (scheme: string) => {
    switch(scheme) {
      case 'ocean': return ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
      case 'forest': return ['#064e3b', '#047857', '#059669', '#10b981', '#34d399'];
      case 'sunset': return ['#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5'];
      case 'pastel': return ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#fcd34d'];
      case 'monochrome': return ['#000000', '#525252', '#737373', '#a3a3a3', '#d4d4d4'];
      default: return COLORS;
    }
  };

  const renderChart = ({ chartType, data, xAxis, selectedColumns, isTimeSeries, stacked, normalized, gridLines, colorScheme, showLegend }: any) => {
    if (!data || !xAxis || selectedColumns.length === 0) return null;

    const colors = getColorScheme(colorScheme);
    const chartData = data.map((row: any) => ({
      x: row[xAxis],
      ...selectedColumns.reduce((acc: any, col: string) => ({
        ...acc,
        [col]: parseFloat(row[col]) || null
      }), {})
    }));

    const commonProps = {
      width: 500,
      height: 300,
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      stroke: darkMode ? '#e5e7eb' : '#374151'
    };

    const commonCartesianProps = {
      ...commonProps,
      children: [
        <CartesianGrid key="grid" strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} opacity={0.5} />,
        <XAxis key="xAxis" dataKey={isTimeSeries ? "date" : "x"} {...commonAxisProps} />,
        <YAxis key="yAxis" {...commonAxisProps} />,
        <Tooltip key="tooltip" contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', borderColor: darkMode ? '#4b5563' : '#e5e7eb' }} />,
        showLegend && <Legend key="legend" />
      ]
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonCartesianProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {selectedColumns.map((col: string, index: number) => (
              <Line
                key={col}
                type={smoothCurves ? "monotone" : "linear"}
                dataKey={col}
                stroke={colors[index % colors.length]}
                name={col}
                dot={{ stroke: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ stroke: colors[index % colors.length], strokeWidth: 2, r: 6 }}
                strokeWidth={2}
                connectNulls
                isAnimationActive={animatedCharts}
                animationDuration={1500}
                opacity={chartOpacity}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonCartesianProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {selectedColumns.map((col: string, index: number) => (
              <Area
                key={col}
                type={smoothCurves ? "monotone" : "linear"}
                dataKey={col}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                name={col}
                fillOpacity={chartOpacity * 0.6}
                strokeWidth={2}
                stackId={stacked ? "1" : undefined}
                isAnimationActive={animatedCharts}
                animationDuration={1500}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonCartesianProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {selectedColumns.map((col: string, index: number) => (
              <Bar
                key={col}
                dataKey={col}
                fill={colors[index % colors.length]}
                name={col}
                isAnimationActive={animatedCharts}
                animationDuration={1500}
                stackId={stacked ? "1" : undefined}
                opacity={chartOpacity}
              />
            ))}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonCartesianProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {selectedColumns.map((col: string, index: number) => (
              index % 2 === 0 ? (
                <Bar
                  key={col}
                  dataKey={col}
                  fill={colors[index % colors.length]}
                  name={col}
                  opacity={chartOpacity}
                  isAnimationActive={animatedCharts}
                />
              ) : (
                <Line
                  key={col}
                  type={smoothCurves ? "monotone" : "linear"}
                  dataKey={col}
                  stroke={colors[index % colors.length]}
                  name={col}
                  strokeWidth={2}
                  isAnimationActive={animatedCharts}
                />
              )
            ))}
          </ComposedChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonCartesianProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {selectedColumns.map((col: string, index: number) => (
              <Scatter
                key={col}
                name={col}
                data={chartData.map((d: any) => ({
                  x: d[isTimeSeries ? "date" : "x"],
                  y: d[col]
                }))}
                fill={colors[index % colors.length]}
                opacity={chartOpacity}
                isAnimationActive={animatedCharts}
              />
            ))}
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart width={500} height={300}>
            <Pie
              data={selectedColumns.map((col: string, index: number) => {
                const sum = chartData.reduce((acc: number, d: any) => acc + (parseFloat(d[col]) || 0), 0);
                return {
                  name: col,
                  value: sum
                };
              })}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              innerRadius={normalized ? 60 : 0}
              isAnimationActive={animatedCharts}
              animationDuration={1500}
              dataKey="value"
            >
              {selectedColumns.map((col: string, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} opacity={chartOpacity} />
              ))}
            </Pie>
            {showLegend && <Legend />}
            <Tooltip />
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart outerRadius={100} width={500} height={300} data={chartData}>
            <PolarGrid stroke={darkMode ? '#4b5563' : '#d1d5db'} />
            <PolarAngleAxis dataKey="x" stroke={darkMode ? '#e5e7eb' : '#374151'} />
            <PolarRadiusAxis stroke={darkMode ? '#e5e7eb' : '#374151'} />
            {selectedColumns.map((col: string, index: number) => (
              <Radar
                key={col}
                name={col}
                dataKey={col}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={chartOpacity * 0.6}
                isAnimationActive={animatedCharts}
              />
            ))}
            {showLegend && <Legend />}
            <Tooltip />
          </RadarChart>
        );
        
      case 'radialBar':
        return (
          <RadialBarChart 
            width={500} 
            height={300} 
            innerRadius="10%" 
            outerRadius="80%" 
            data={selectedColumns.map((col: string, index: number) => {
              const avgValue = chartData.reduce((acc: number, d: any) => acc + (parseFloat(d[col]) || 0), 0) / chartData.length;
              const normalizedValue = avgValue; // Vous pourriez normaliser ici si nécessaire
              return {
                name: col,
                value: normalizedValue,
                fill: colors[index % colors.length]
              };
            })} 
            startAngle={0} 
            endAngle={360}
          >
            <RadialBar 
              background
              dataKey="value" 
              opacity={chartOpacity}
              isAnimationActive={animatedCharts}
            />
            {showLegend && <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />}
            <Tooltip />
          </RadialBarChart>
        );

      case 'treemap':
        return (
          <Treemap
            width={500}
            height={300}
            data={selectedColumns.map((col: string, index: number) => {
              const sum = chartData.reduce((acc: number, d: any) => acc + (parseFloat(d[col]) || 0), 0);
              return {
                name: col,
                size: sum,
                fill: colors[index % colors.length]
              };
            })}
            dataKey="size"
            aspectRatio={4/3}
            stroke="#fff"
            isAnimationActive={animatedCharts}
            animationDuration={1500}
          >
            <Tooltip />
          </Treemap>
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
      isTimeSeries: false,
      title: `Graphique ${prev.length + 1}`,
      gridArea: 'auto',
      showLegend: true,
      stacked: false,
      normalized: false,
      gridLines: true,
      colorScheme: 'default'
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

  const exportDashboard = () => {
    const dashboardConfig = {
      charts,
      settings: {
        darkMode,
        dashboardMode,
        autoRefresh,
        refreshInterval,
        animatedCharts,
        smoothCurves
      }
    };
    
    const blob = new Blob([JSON.stringify(dashboardConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuration exportée",
      description: "La configuration du tableau de bord a été téléchargée",
    });
  };

  const importDashboard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        if (config.charts && Array.isArray(config.charts)) {
          setCharts(config.charts);
          
          if (config.settings) {
            setDarkMode(config.settings.darkMode || false);
            setDashboardMode(config.settings.dashboardMode || 'auto');
            setAutoRefresh(config.settings.autoRefresh || false);
            setRefreshInterval(config.settings.refreshInterval || 30);
            setAnimatedCharts(config.settings.animatedCharts || true);
            setSmoothCurves(config.settings.smoothCurves || true);
          }
          
          toast({
            title: "Configuration importée",
            description: "La configuration du tableau de bord a été chargée avec succès",
          });
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Format de fichier de configuration invalide",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        Veuillez télécharger des données pour commencer la visualisation
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${darkMode ? 'bg-gray-900 text-white' : ''}`}>
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Tableau de données</TabsTrigger>
          <TabsTrigger value="charts">Graphiques</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Données brutes</h3>
              <DataCleaningDialog data={data} columns={columns} onDataChange={setData} />
            </div>
            <DataTable data={data} onDataChange={setData} />
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <Button onClick={addNewChart}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un graphique
                </Button>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importDashboard}
                  />
                  <Button variant="outline" asChild>
                    <span>Importer</span>
                  </Button>
                </label>
              </div>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={exportDashboard}>
                  <Download className="w-4 h-4 mr-1" />
                  Exporter
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <LayoutGrid className="w-4 h-4 mr-1" />
                      Layout: {dashboardMode === 'auto' ? 'Auto' : 'Grille'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Options d'affichage</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Mode d'affichage</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={dashboardMode === 'auto' ? 'default' : 'outline'}
                            onClick={() => setDashboardMode('auto')}
                          >
                            Auto
                          </Button>
                          <Button
                            variant={dashboardMode === 'grid' ? 'default' : 'outline'}
                            onClick={() => setDashboardMode('grid')}
                          >
                            Grille
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode">Mode sombre</Label>
                        <Switch 
                          id="dark-mode" 
                          checked={darkMode} 
                          onCheckedChange={setDarkMode} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-refresh">Rafraîchissement automatique</Label>
                        <Switch 
                          id="auto-refresh" 
                          checked={autoRefresh} 
                          onCheckedChange={setAutoRefresh} 
                        />
                      </div>
                      
                      {autoRefresh && (
                        <div className="space-y-2">
                          <Label>Intervalle de rafraîchissement (secondes): {refreshInterval}</Label>
                          <Slider
                            value={[refreshInterval]}
                            min={5}
                            max={300}
                            step={5}
                            onValueChange={(values) => setRefreshInterval(values[0])}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="animated-charts">Animations des graphiques</Label>
                        <Switch 
                          id="animated-charts" 
                          checked={animatedCharts} 
                          onCheckedChange={setAnimatedCharts} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smooth-curves">Courbes lissées</Label>
                        <Switch 
                          id="smooth-curves" 
                          checked={smoothCurves} 
                          onCheckedChange={setSmoothCurves} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Opacité des graphiques: {chartOpacity.toFixed(1)}</Label>
                        <Slider
                          value={[chartOpacity * 10]}
                          min={3}
                          max={10}
                          step={1}
                          onValueChange={(values) => setChartOpacity(values[0] / 10)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="color-palette">Palette de couleurs</Label>
                        <Select value={colorPalette} onValueChange={setColorPalette}>
                          <SelectTrigger id="color-palette">
                            <SelectValue placeholder="Choisir une palette" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Par défaut</SelectItem>
                            <SelectItem value="ocean">Océan</SelectItem>
                            <SelectItem value="forest">Forêt</SelectItem>
                            <SelectItem value="sunset">Coucher de soleil</SelectItem>
                            <SelectItem value="pastel">Pastel</SelectItem>
                            <SelectItem value="monochrome">Monochrome</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className={`grid ${dashboardMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 gap-6' : 'grid-cols-1 gap-6'}`}>
              {charts.map((chart) => (
                <Card key={chart.id} className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Input
                        value={chart.title}
                        onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                        className="w-1/3 text-lg font-medium"
                      />
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Paramètres du graphique</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor={`chart-type-${chart.id}`}>Type de graphique</Label>
                                <Select
                                  value={chart.chartType}
                                  onValueChange={(value) => updateChart(chart.id, { chartType: value })}
                                >
                                  <SelectTrigger id={`chart-type-${chart.id}`}>
                                    <SelectValue placeholder="Sélectionner un type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CHART_TYPES.map(type => (
                                      <SelectItem key={type.type} value={type.type}>
                                        {type.icon} {type.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`color-scheme-${chart.id}`}>Schéma de couleurs</Label>
                                <Select
                                  value={chart.colorScheme}
                                  onValueChange={(value) => updateChart(chart.id, { colorScheme: value })}
                                >
                                  <SelectTrigger id={`color-scheme-${chart.id}`}>
                                    <SelectValue placeholder="Sélectionner un schéma" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Par défaut</SelectItem>
                                    <SelectItem value="ocean">Océan</SelectItem>
                                    <SelectItem value="forest">Forêt</SelectItem>
                                    <SelectItem value="sunset">Coucher de soleil</SelectItem>
                                    <SelectItem value="pastel">Pastel</SelectItem>
                                    <SelectItem value="monochrome">Monochrome</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`show-legend-${chart.id}`}>Afficher la légende</Label>
                                <Switch 
                                  id={`show-legend-${chart.id}`} 
                                  checked={chart.showLegend} 
                                  onCheckedChange={(checked) => updateChart(chart.id, { showLegend: checked })}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`stacked-${chart.id}`}>Empilé</Label>
                                <Switch 
                                  id={`stacked-${chart.id}`} 
                                  checked={chart.stacked} 
                                  onCheckedChange={(checked) => updateChart(chart.id, { stacked: checked })}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`normalized-${chart.id}`}>Normalisé</Label>
                                <Switch 
                                  id={`normalized-${chart.id}`} 
                                  checked={chart.normalized} 
                                  onCheckedChange={(checked) => updateChart(chart.id, { normalized: checked })}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`grid-lines-${chart.id}`}>Lignes de grille</Label>
                                <Switch 
                                  id={`grid-lines-${chart.id}`} 
                                  checked={chart.gridLines} 
                                  onCheckedChange={(checked) => updateChart(chart.id, { gridLines: checked })}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChart(chart.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Select
                        value={chart.xAxis}
                        onValueChange={(value) => updateChart(chart.id, { xAxis: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Axe X" />
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
                          Série temporelle
                        </label>
                      </div>
                    </div>

                    <ScrollArea className="h-48 mb-4">
                      <div className="space-y-2 p-4">
                        <h4 className="font-medium mb-2">Sélectionner les variables:</h4>
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
                          isTimeSeries: chart.isTimeSeries,
                          stacked: chart.stacked,
                          normalized: chart.normalized,
                          gridLines: chart.gridLines,
                          colorScheme: chart.colorScheme,
                          showLegend: chart.showLegend
                        })}
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Paramètres du tableau de bord</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Apparence</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode-setting">Mode sombre</Label>
                    <Switch 
                      id="dark-mode-setting" 
                      checked={darkMode} 
                      onCheckedChange={setDarkMode} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-mode">Mode d'affichage</Label>
                    <Select value={dashboardMode} onValueChange={(value: 'auto' | 'grid') => setDashboardMode(value)}>
                      <SelectTrigger id="dashboard-mode">
                        <SelectValue placeholder="Choisir un mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatique</SelectItem>
                        <SelectItem value="grid">Grille</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color-scheme">Thème de couleurs</Label>
                    <Select value={colorPalette} onValueChange={setColorPalette}>
                      <SelectTrigger id="color-scheme">
                        <SelectValue placeholder="Choisir un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Par défaut</SelectItem>
                        <SelectItem value="ocean">Océan</SelectItem>
                        <SelectItem value="forest">Forêt</SelectItem>
                        <SelectItem value="sunset">Coucher de soleil</SelectItem>
                        <SelectItem value="pastel">Pastel</SelectItem>
                        <SelectItem value="monochrome">Monochrome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Comportement</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-refresh-setting">Rafraîchissement automatique</Label>
                    <Switch 
                      id="auto-refresh-setting" 
                      checked={autoRefresh} 
                      onCheckedChange={setAutoRefresh} 
                    />
                  </div>
                  
                  {autoRefresh && (
                    <div className="space-y-2">
                      <Label>Intervalle de rafraîchissement: {refreshInterval} secondes</Label>
                      <Slider
                        value={[refreshInterval]}
                        min={5}
                        max={300}
                        step={5}
                        onValueChange={(values) => setRefreshInterval(values[0])}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations-setting">Animations des graphiques</Label>
                    <Switch 
                      id="animations-setting" 
                      checked={animatedCharts} 
                      onCheckedChange={setAnimatedCharts} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smooth-curves-setting">Courbes lissées</Label>
                    <Switch 
                      id="smooth-curves-setting" 
                      checked={smoothCurves} 
                      onCheckedChange={setSmoothCurves} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Exportation et importation</h4>
                
                <div className="flex space-x-4">
                  <Button onClick={exportDashboard}>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter la configuration
                  </Button>
                  
                  <label>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={importDashboard}
                    />
                    <Button variant="outline" asChild>
                      <span>Importer une configuration</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;
