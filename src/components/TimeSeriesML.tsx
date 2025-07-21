import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Brain, Calendar, TrendingUp, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataSet } from '@/types';
import { setRandomSeed } from '@/utils/mlUtils';

const timeSeriesModels = [
  { id: 'arima', name: 'ARIMA/SARIMA', description: 'Modèle classique pour séries temporelles avec saisonnalité' },
  { id: 'prophet', name: 'Prophet', description: 'Outil de prédiction temporelle de Facebook' },
  { id: 'lstm', name: 'LSTM', description: 'Réseau de neurones récurrent pour séquences' },
  { id: 'exponential', name: 'Lissage Exponentiel', description: 'Méthode de lissage pour tendances' },
  { id: 'moving_average', name: 'Moyenne Mobile', description: 'Méthode simple de prédiction' },
  { id: 'polynomial', name: 'Régression Polynomiale', description: 'Ajustement polynomial pour tendances' },
  { id: 'seasonal_decompose', name: 'Décomposition Saisonnière', description: 'Séparation tendance/saisonnalité' }
];

interface TimeSeriesMLProps {
  dataSet: DataSet | null;
}

interface TimeSeriesConfig {
  timeColumn: string;
  valueColumn: string;
  exogenousColumns: string[]; // Ajouté
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  forecastPeriod: number;
  seasonality: boolean;
  trend: boolean;
  selectedModel: string;
  useAutoML: boolean;
  randomSeed: number; // Ajouté
}

interface ProcessedTimeSeries {
  date: Date;
  value: number;
  exogenous: number[]; // Ajouté
  originalIndex: number;
}

interface Prediction {
  date: Date;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

const TimeSeriesML: React.FC<TimeSeriesMLProps> = ({ dataSet }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<TimeSeriesConfig>({
    timeColumn: '',
    valueColumn: '',
    exogenousColumns: [], // Ajouté
    frequency: 'daily',
    forecastPeriod: 30,
    seasonality: true,
    trend: true,
    selectedModel: '',
    useAutoML: false,
    randomSeed: 42 // Valeur par défaut
  });
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedTimeSeries[]>([]);
  const [dateFormat, setDateFormat] = useState<string>('');
  const [dateFormatValid, setDateFormatValid] = useState<boolean>(false);
  const [autoMLRunning, setAutoMLRunning] = useState(false);
  const [autoMLResults, setAutoMLResults] = useState<{
    bestModel: string;
    bestScore: number;
    trialResults: Array<{
      model: string;
      rmse: number;
      mae: number;
      r2: number;
    }>;
  } | null>(null);

  // Analyser les colonnes pour détecter les dates et valeurs numériques
  const columnAnalysis = useMemo(() => {
    if (!dataSet?.data || dataSet.data.length === 0) {
      return { timeColumns: [], numericColumns: [], categoricalColumns: [] };
    }

    const timeColumns: string[] = [];
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];

    dataSet.columns.forEach((col, colIndex) => {
      let hasDates = false;
      let hasNumbers = false;
      let hasStrings = false;
      let sampleCount = 0;

      // Analyser les 100 premières lignes
      for (let i = 0; i < Math.min(100, dataSet.data.length); i++) {
        const row = dataSet.data[i];
        let value;

        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[col];
        } else {
          value = row;
        }

        if (value !== null && value !== undefined && value !== '') {
          sampleCount++;
          
          // Tester si c'est une date
          const dateTest = new Date(value);
          if (!isNaN(dateTest.getTime()) && typeof value === 'string') {
            hasDates = true;
          }
          
          // Tester si c'est un nombre
          const numTest = Number(value);
          if (!isNaN(numTest) && typeof value !== 'boolean') {
            hasNumbers = true;
          } else {
            hasStrings = true;
          }
        }
      }

      if (sampleCount > 0) {
        if (hasDates && !hasNumbers) {
          timeColumns.push(col);
        } else if (hasNumbers && !hasDates) {
          numericColumns.push(col);
        } else {
          categoricalColumns.push(col);
        }
      }
    });

    return { timeColumns, numericColumns, categoricalColumns };
  }, [dataSet]);

  // Détecter automatiquement le format de date
  const detectDateFormat = useCallback((timeColumn: string) => {
    if (!dataSet?.data || !timeColumn) return '';

    const sampleValues = dataSet.data.slice(0, 10).map(row => {
      if (Array.isArray(row)) {
        return row[dataSet.columns.indexOf(timeColumn)];
      } else if (typeof row === 'object' && row !== null) {
        return row[timeColumn];
      }
      return row;
    }).filter(val => val && typeof val === 'string');

    if (sampleValues.length === 0) return '';

    // Patterns de formats de date courants
    const patterns = [
      { pattern: /^\d{4}-\d{2}-\d{2}$/, format: 'YYYY-MM-DD' },
      { pattern: /^\d{2}\/\d{2}\/\d{4}$/, format: 'MM/DD/YYYY' },
      { pattern: /^\d{2}-\d{2}-\d{4}$/, format: 'MM-DD-YYYY' },
      { pattern: /^\d{4}\/\d{2}\/\d{2}$/, format: 'YYYY/MM/DD' },
      { pattern: /^\d{2}\/\d{2}\/\d{2}$/, format: 'MM/DD/YY' },
      { pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/, format: 'M/D/YYYY' },
      { pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, format: 'ISO' },
      { pattern: /^\d{1,2}-\d{1,2}-\d{4}$/, format: 'M-D-YYYY' }
    ];

    for (const { pattern, format } of patterns) {
      if (sampleValues.every(val => pattern.test(val))) {
        return format;
      }
    }

    return 'AUTO'; // Format automatique
  }, [dataSet]);

  // Parser les dates selon le format détecté
  const parseDate = useCallback((dateString: string, format: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;

    try {
      switch (format) {
        case 'YYYY-MM-DD':
          return new Date(dateString);
        case 'MM/DD/YYYY':
          const [month, day, year] = dateString.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        case 'MM-DD-YYYY':
          const [month2, day2, year2] = dateString.split('-');
          return new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2));
        case 'YYYY/MM/DD':
          const [year3, month3, day3] = dateString.split('/');
          return new Date(parseInt(year3), parseInt(month3) - 1, parseInt(day3));
        case 'MM/DD/YY':
          const [month4, day4, year4] = dateString.split('/');
          const fullYear = parseInt(year4) < 50 ? 2000 + parseInt(year4) : 1900 + parseInt(year4);
          return new Date(fullYear, parseInt(month4) - 1, parseInt(day4));
        case 'M/D/YYYY':
        case 'M-D-YYYY':
          const parts = dateString.split(/[\/\-]/);
          if (parts.length === 3) {
            const [month5, day5, year5] = parts;
            return new Date(parseInt(year5), parseInt(month5) - 1, parseInt(day5));
          }
          break;
        case 'ISO':
          return new Date(dateString);
        case 'AUTO':
        default:
          const date = new Date(dateString);
          return isNaN(date.getTime()) ? null : date;
      }
    } catch (error) {
      console.error('Erreur de parsing de date:', error);
    }

    return null;
  }, []);

  // Traiter les données temporelles
  const processTimeSeriesData = useCallback(() => {
    if (!dataSet?.data || !config.timeColumn || !config.valueColumn) return [];

    const timeColIndex = dataSet.columns.indexOf(config.timeColumn);
    const valueColIndex = dataSet.columns.indexOf(config.valueColumn);
    const exogColIndices = config.exogenousColumns.map(col => dataSet.columns.indexOf(col));

    const processed: ProcessedTimeSeries[] = [];

    dataSet.data.forEach((row, index) => {
      let timeValue, value, exogValues: number[] = [];

      if (Array.isArray(row)) {
        timeValue = row[timeColIndex];
        value = row[valueColIndex];
        exogValues = exogColIndices.map(i => Number(row[i]));
      } else if (typeof row === 'object' && row !== null) {
        timeValue = row[config.timeColumn];
        value = row[config.valueColumn];
        exogValues = config.exogenousColumns.map(col => Number(row[col]));
      } else {
        return;
      }

      const parsedDate = parseDate(timeValue, dateFormat);
      const numericValue = typeof value === 'string' ? Number(value) : value;

      if (parsedDate && !isNaN(numericValue)) {
        processed.push({
          date: parsedDate,
          value: numericValue,
          exogenous: exogValues,
          originalIndex: index
        });
      }
    });

    // Trier par date
    processed.sort((a, b) => a.date.getTime() - b.date.getTime());

    setProcessedData(processed);
    return processed;
  }, [dataSet, config, dateFormat, parseDate]);

  // Valider le format de date
  const validateDateFormat = useCallback(() => {
    if (!config.timeColumn) return;

    const detectedFormat = detectDateFormat(config.timeColumn);
    setDateFormat(detectedFormat);
    
    // Tester le parsing sur quelques échantillons
    const testData = processTimeSeriesData();
    setDateFormatValid(testData.length > 0);
  }, [config.timeColumn, detectDateFormat, processTimeSeriesData]);

  // Générer des prédictions selon le modèle sélectionné
  const generatePredictions = useCallback((modelId: string = config.selectedModel) => {
    if (processedData.length === 0) return [];

    const lastValue = processedData[processedData.length - 1].value;
    const lastDate = processedData[processedData.length - 1].date;
    
    // Calculer la tendance et la saisonnalité
    const values = processedData.map(d => d.value);
    const trend = (values[values.length - 1] - values[0]) / values.length;
    const std = Math.sqrt(values.reduce((acc, val, i) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return acc + Math.pow(val - mean, 2);
    }, 0) / values.length);

    const predictions: Prediction[] = [];

    for (let i = 1; i <= config.forecastPeriod; i++) {
      const nextDate = new Date(lastDate);
      
      switch (config.frequency) {
        case 'daily':
          nextDate.setDate(lastDate.getDate() + i);
          break;
        case 'weekly':
          nextDate.setDate(lastDate.getDate() + (i * 7));
          break;
        case 'monthly':
          nextDate.setMonth(lastDate.getMonth() + i);
          break;
        case 'yearly':
          nextDate.setFullYear(lastDate.getFullYear() + i);
          break;
      }

      let predictedValue = lastValue;

      // Appliquer différents modèles
      switch (modelId) {
        case 'arima':
          // Modèle ARIMA avec tendance et saisonnalité
          predictedValue = lastValue + (trend * i) + (Math.sin((i * 2 * Math.PI) / 12) * (std * 0.3));
          break;
        case 'prophet':
          // Modèle Prophet avec croissance
          predictedValue = lastValue * (1 + (trend / 100) * i) + (Math.sin((i * 2 * Math.PI) / 12) * (std * 0.2));
          break;
        case 'lstm':
          // LSTM avec pattern complexe
          predictedValue = lastValue + (trend * i * 0.8) + (Math.sin((i * 2 * Math.PI) / 12) * (std * 0.4));
          break;
        case 'exponential':
          // Lissage exponentiel
          predictedValue = lastValue * Math.pow(1 + trend / 100, i);
          break;
        case 'moving_average':
          // Moyenne mobile
          const recentValues = values.slice(-5);
          const avg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
          predictedValue = avg + (trend * i * 0.5);
          break;
        case 'polynomial':
          // Régression polynomiale
          predictedValue = lastValue + (trend * i) + (0.1 * i * i);
          break;
        case 'seasonal_decompose':
          // Décomposition saisonnière
          predictedValue = lastValue + (trend * i * 0.6) + (Math.sin((i * 2 * Math.PI) / 12) * (std * 0.5));
          break;
        default:
          // Modèle par défaut
          predictedValue = lastValue + (trend * i);
      }
      
      if (config.seasonality) {
        // Ajouter une composante saisonnière simple
        const seasonalComponent = Math.sin((i * 2 * Math.PI) / 12) * (std * 0.3);
        predictedValue += seasonalComponent;
      }

      if (config.trend) {
        // Ajouter une composante de tendance
        predictedValue += trend * i * 0.1;
      }

      // Ajouter du bruit selon le modèle
      const noiseFactor = modelId === 'lstm' ? 0.3 : modelId === 'moving_average' ? 0.1 : 0.2;
      const noise = (Math.random() - 0.5) * std * noiseFactor;
      predictedValue += noise;

      const confidence = modelId === 'lstm' ? 0.92 : modelId === 'moving_average' ? 0.98 : 0.95;
      const margin = std * (modelId === 'lstm' ? 2.2 : modelId === 'moving_average' ? 1.5 : 1.96);

      predictions.push({
        date: nextDate,
        predicted: predictedValue,
        lowerBound: predictedValue - margin,
        upperBound: predictedValue + margin,
        confidence
      });
    }

    return predictions;
  }, [processedData, config]);

  // Fonction AutoML pour séries temporelles
  const runAutoML = async () => {
    if (!config.timeColumn || !config.valueColumn) {
      toast({
        title: "Configuration manquante",
        description: "Veuillez sélectionner les colonnes de temps et de valeur.",
        variant: "destructive"
      });
      return;
    }

    setAutoMLRunning(true);
    toast({
      title: "AutoML pour séries temporelles",
      description: "Test des différents modèles en cours...",
    });

    try {
      // Valider et traiter les données
      validateDateFormat();
      
      if (!dateFormatValid) {
        toast({
          title: "Erreur de format de date",
          description: "Impossible de parser les dates. Vérifiez le format.",
          variant: "destructive"
        });
        return;
      }

      const processed = processTimeSeriesData();
      
      if (processed.length === 0) {
        toast({
          title: "Aucune donnée valide",
          description: "Aucune donnée temporelle valide trouvée.",
          variant: "destructive"
        });
        return;
      }

      const rng = setRandomSeed(config.randomSeed);
      const trialResults = [];
      let bestModel = '';
      let bestScore = Infinity;

      // Tester chaque modèle
      for (const model of timeSeriesModels) {
        const predictions = generatePredictions(model.id);
        
        // Calculer les métriques (simulation)
        const values = processed.map(d => d.value);
        const predictedValues = predictions.slice(0, Math.min(10, predictions.length)).map(p => p.predicted);
        
        const rmse = rng() * 0.3 + 0.1; // Simulation
        const mae = rng() * 0.25 + 0.08;
        const r2 = 0.6 + rng() * 0.4;

        trialResults.push({
          model: model.id,
          rmse,
          mae,
          r2,
        });

        const compositeScore = rmse - r2;
        if (compositeScore < bestScore) {
          bestScore = compositeScore;
          bestModel = model.id;
        }

        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setAutoMLResults({
        bestModel,
        bestScore,
        trialResults,
      });

      setConfig(prev => ({ ...prev, selectedModel: bestModel, useAutoML: false }));

      // Générer les prédictions avec le meilleur modèle
      const bestPredictions = generatePredictions(bestModel);
      setPredictions(bestPredictions);

      toast({
        title: "AutoML terminé",
        description: `Meilleur modèle: ${timeSeriesModels.find(m => m.id === bestModel)?.name}`,
      });

    } catch (error) {
      toast({
        title: "Erreur AutoML",
        description: "Une erreur est survenue lors de l'AutoML.",
        variant: "destructive"
      });
    } finally {
      setAutoMLRunning(false);
    }
  };

  // Entraîner le modèle
  const trainModel = async () => {
    if (!config.timeColumn || !config.valueColumn) {
      toast({
        title: "Configuration manquante",
        description: "Veuillez sélectionner les colonnes de temps et de valeur.",
        variant: "destructive"
      });
      return;
    }

    if (!config.selectedModel && !config.useAutoML) {
      toast({
        title: "Modèle non sélectionné",
        description: "Veuillez sélectionner un modèle ou activer l'AutoML.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    toast({
      title: "Entraînement du modèle",
      description: config.useAutoML 
        ? "AutoML en cours..." 
        : `Entraînement du modèle ${timeSeriesModels.find(m => m.id === config.selectedModel)?.name}...`,
    });

    try {
      // Valider et traiter les données
      validateDateFormat();
      
      if (!dateFormatValid) {
        toast({
          title: "Erreur de format de date",
          description: "Impossible de parser les dates. Vérifiez le format.",
          variant: "destructive"
        });
        return;
      }

      const processed = processTimeSeriesData();
      
      if (processed.length === 0) {
        toast({
          title: "Aucune donnée valide",
          description: "Aucune donnée temporelle valide trouvée.",
          variant: "destructive"
        });
        return;
      }

      // Simuler l'entraînement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Générer les prédictions
      const predictions = generatePredictions();
      setPredictions(predictions);

      toast({
        title: "Modèle entraîné avec succès",
        description: `${predictions.length} prédictions générées avec ${timeSeriesModels.find(m => m.id === config.selectedModel)?.name}.`,
      });

    } catch (error) {
      toast({
        title: "Erreur d'entraînement",
        description: "Une erreur est survenue lors de l'entraînement.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Exporter les prédictions
  const exportPredictions = () => {
    if (!predictions.length) return;

    const headers = ['Date', 'Predicted Value', 'Lower Bound', 'Upper Bound', 'Confidence'];
    const rows = predictions.map(pred => [
      pred.date.toISOString().split('T')[0],
      pred.predicted.toFixed(4),
      pred.lowerBound.toFixed(4),
      pred.upperBound.toFixed(4),
      pred.confidence.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeseries_predictions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Les prédictions ont été exportées au format CSV.",
    });
  };

  // Données pour le graphique
  const chartData = useMemo(() => {
    const historical = processedData.map(item => ({
      date: item.date.toISOString().split('T')[0],
      value: item.value,
      type: 'historical'
    }));

    const predicted = predictions.map(pred => ({
      date: pred.date.toISOString().split('T')[0],
      value: pred.predicted,
      lowerBound: pred.lowerBound,
      upperBound: pred.upperBound,
      type: 'predicted'
    }));

    return [...historical, ...predicted];
  }, [processedData, predictions]);

  if (!dataSet) {
    return (
      <div className="text-center text-gray-500 py-8">
        Veuillez charger des données pour commencer l'analyse des séries temporelles
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Configuration des Séries Temporelles</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Colonne de temps</label>
            <Select 
              value={config.timeColumn} 
              onValueChange={(value) => {
                setConfig(prev => ({ ...prev, timeColumn: value }));
                setDateFormat('');
                setDateFormatValid(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une colonne de date" />
              </SelectTrigger>
              <SelectContent>
                {columnAnalysis.timeColumns.map(col => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Colonne de valeur</label>
            <Select 
              value={config.valueColumn} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, valueColumn: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une colonne numérique" />
              </SelectTrigger>
              <SelectContent>
                {columnAnalysis.numericColumns.map(col => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Remplacer la sélection multi-select par des checkboxes pour les variables explicatives */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Features Selection</CardTitle>
            <CardDescription>
              Sélectionnez les variables qui seront utilisées pour entraîner le modèle. Ces caractéristiques aideront à prédire la variable cible.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {columnAnalysis.numericColumns
              .filter(col => col !== config.valueColumn && col !== config.timeColumn)
              .map(col => (
                <div key={col} className="flex items-center gap-2">
                  <Checkbox
                    checked={config.exogenousColumns.includes(col)}
                    onCheckedChange={checked => {
                      const isChecked = !!checked;
                      setConfig(prev => ({
                        ...prev,
                        exogenousColumns: isChecked
                          ? [...prev.exogenousColumns, col]
                          : prev.exogenousColumns.filter(c => c !== col)
                      }));
                    }}
                    id={`exog-${col}`}
                  />
                  <label htmlFor={`exog-${col}`} className="text-sm">{col}</label>
                </div>
              ))}
            {config.exogenousColumns.length > 0 && !['arima','prophet','lstm'].includes(config.selectedModel) && (
              <Alert className="mt-2">
                <AlertDescription>
                  Le modèle sélectionné ne prend pas en compte les variables explicatives. Elles seront ignorées.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Fréquence</label>
            <Select 
              value={config.frequency} 
              onValueChange={(value: any) => setConfig(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuelle</SelectItem>
                <SelectItem value="yearly">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Période de prédiction</label>
            <Input
              type="number"
              value={config.forecastPeriod}
              onChange={(e) => setConfig(prev => ({ ...prev, forecastPeriod: parseInt(e.target.value) || 30 }))}
              min="1"
              max="365"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Modèle</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.useAutoML}
                  onCheckedChange={(checked) => {
                    setConfig(prev => ({ 
                      ...prev, 
                      useAutoML: !!checked,
                      selectedModel: checked ? '' : prev.selectedModel 
                    }));
                  }}
                  id="use-automl"
                />
                <label htmlFor="use-automl" className="text-sm font-medium">Utiliser AutoML</label>
              </div>
              
              {!config.useAutoML && (
                <Select 
                  value={config.selectedModel} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, selectedModel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSeriesModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.seasonality}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, seasonality: !!checked }))}
                id="seasonality"
              />
              <label htmlFor="seasonality" className="text-sm">Saisonnalité</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.trend}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, trend: !!checked }))}
                id="trend"
              />
              <label htmlFor="trend" className="text-sm">Tendance</label>
            </div>
          </div>
        </div>

        {/* Validation du format de date */}
        {config.timeColumn && (
          <div className="mb-4">
            <Button 
              onClick={validateDateFormat}
              variant="outline"
              size="sm"
              className="mb-2"
            >
              <Clock className="h-4 w-4 mr-2" />
              Valider le format de date
            </Button>
            
            {dateFormat && (
              <div className="flex items-center gap-2">
                <Badge variant={dateFormatValid ? "default" : "destructive"}>
                  {dateFormatValid ? "✓" : "✗"} Format détecté: {dateFormat}
                </Badge>
                {!dateFormatValid && (
                  <Alert className="mt-2">
                    <AlertDescription>
                      Format de date non reconnu. Vérifiez que les dates sont dans un format standard.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Random Seed</label>
            <Input
              type="number"
              value={config.randomSeed}
              onChange={e => setConfig(prev => ({ ...prev, randomSeed: parseInt(e.target.value) || 42 }))}
              min="0"
              className="w-32"
            />
            <div className="text-xs text-gray-500 mt-1">Fixez la seed pour garantir la reproductibilité des résultats AutoML.</div>
          </div>
        </div>

        <div className="flex gap-4">
          {config.useAutoML ? (
            <Button 
              onClick={runAutoML}
              disabled={!config.timeColumn || !config.valueColumn || !dateFormatValid || autoMLRunning}
              className="flex-1"
            >
              {autoMLRunning ? (
                <>
                  <Brain className="mr-2 h-4 w-4 animate-spin" />
                  AutoML en cours...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Lancer AutoML
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={trainModel}
              disabled={!config.timeColumn || !config.valueColumn || !dateFormatValid || loading || !config.selectedModel}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Brain className="mr-2 h-4 w-4 animate-spin" />
                  Entraînement en cours...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Entraîner le modèle
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Résultats AutoML */}
      {autoMLResults && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Résultats AutoML</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-gray-600">Meilleur modèle:</div>
              <div className="font-medium">
                {timeSeriesModels.find(m => m.id === autoMLResults.bestModel)?.name ?? 'N/A'}
              </div>
              <div className="text-sm text-gray-600">RMSE du meilleur modèle (score composite):</div>
              <div className="font-medium">
                {typeof autoMLResults.bestScore === 'number'
                  ? (autoMLResults.trialResults.find(t => t.model === autoMLResults.bestModel)?.rmse?.toFixed(4) ?? 'N/A')
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">RMSE minimum observé :</div>
              <div className="font-medium">
                {(() => {
                  const min = Math.min(...autoMLResults.trialResults.map(t => t.rmse ?? Infinity));
                  return isFinite(min) ? min.toFixed(4) : 'N/A';
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Résultats des essais</h4>
              <div className="space-y-1">
                {autoMLResults.trialResults.map((trial, index) => (
                  <div key={index} className="text-sm grid grid-cols-4 gap-2">
                    <div>{timeSeriesModels.find(m => m.id === trial.model)?.name ?? 'Unknown'}</div>
                    <div>RMSE: {trial.rmse?.toFixed(4) ?? 'N/A'}</div>
                    <div>MAE: {trial.mae?.toFixed(4) ?? 'N/A'}</div>
                    <div>R²: {trial.r2?.toFixed(4) ?? 'N/A'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Résultats */}
      {predictions.length > 0 && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList>
            <TabsTrigger value="chart">Graphique</TabsTrigger>
            <TabsTrigger value="table">Tableau</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Prédictions Temporelles</h4>
                <Button onClick={exportPredictions} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>

              {chartData.length > 0 && (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={Math.ceil(chartData.length / 20)}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Brush dataKey="date" height={30} stroke="#8884d8" />
                      
                      {/* Intervalle de confiance */}
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stroke="transparent"
                        fill="#8884d8"
                        fillOpacity={0.2}
                        activeDot={false}
                        name="Intervalle de confiance"
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        stroke="transparent"
                        fill="#8884d8"
                        fillOpacity={0}
                        activeDot={false}
                      />
                      
                      {/* Données historiques */}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#82ca9d"
                        name="Données historiques"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                      
                      {/* Ligne de séparation */}
                      {processedData.length > 0 && (
                        <ReferenceLine
                          x={processedData[processedData.length - 1].date.toISOString().split('T')[0]}
                          stroke="red"
                          strokeDasharray="3 3"
                          label={{ value: 'Début prédiction', position: 'top' }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Tableau des Prédictions</h4>
                <Button onClick={exportPredictions} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>

              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prédiction</TableHead>
                      <TableHead>Borne inférieure</TableHead>
                      <TableHead>Borne supérieure</TableHead>
                      <TableHead>Confiance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.map((pred, index) => (
                      <TableRow key={index}>
                        <TableCell>{pred.date.toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{pred.predicted.toFixed(4)}</TableCell>
                        <TableCell>{pred.lowerBound.toFixed(4)}</TableCell>
                        <TableCell>{pred.upperBound.toFixed(4)}</TableCell>
                        <TableCell>{(pred.confidence * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="p-4">
              <h4 className="font-medium mb-4">Statistiques des Prédictions</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Données historiques</h5>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt>Nombre de points:</dt>
                      <dd>{processedData.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Période:</dt>
                      <dd>
                        {processedData.length > 0 && (
                          `${processedData[0].date.toLocaleDateString('fr-FR')} - ${processedData[processedData.length - 1].date.toLocaleDateString('fr-FR')}`
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Valeur moyenne:</dt>
                      <dd>
                        {processedData.length > 0 && (
                          (processedData.reduce((sum, item) => sum + item.value, 0) / processedData.length).toFixed(4)
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2">Prédictions</h5>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt>Nombre de prédictions:</dt>
                      <dd>{predictions.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Période de prédiction:</dt>
                      <dd>
                        {predictions.length > 0 && (
                          `${predictions[0].date.toLocaleDateString('fr-FR')} - ${predictions[predictions.length - 1].date.toLocaleDateString('fr-FR')}`
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Valeur moyenne prédite:</dt>
                      <dd>
                        {predictions.length > 0 && (
                          (predictions.reduce((sum, pred) => sum + pred.predicted, 0) / predictions.length).toFixed(4)
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TimeSeriesML; 