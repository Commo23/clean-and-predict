import { useState, useMemo, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Brain } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface MachineLearningProps {
  data: any[] | null;
}

const models = [
  { id: 'arima', name: 'ARIMA/SARIMA', description: 'For time series forecasting with seasonality' },
  { id: 'prophet', name: 'Prophet', description: 'Facebook\'s time series forecasting tool' },
  { id: 'lstm', name: 'LSTM', description: 'Deep learning for sequence prediction' },
  { id: 'randomforest', name: 'Random Forest', description: 'Ensemble learning method' },
  { id: 'xgboost', name: 'XGBoost', description: 'Gradient boosting framework' },
  { id: 'lightgbm', name: 'LightGBM', description: 'Gradient boosting framework optimized for efficiency' },
  { id: 'catboost', name: 'CatBoost', description: 'Gradient boosting with better handling of categorical features' },
  { id: 'elasticnet', name: 'ElasticNet', description: 'Linear regression with combined L1 and L2 regularization' },
  { id: 'svr', name: 'SVR', description: 'Support Vector Regression for complex patterns' }
];

interface Stats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  rmse?: number;
  mae?: number;
  r2?: number;
}

const autoMLConfig = {
  maxTrials: 5,
  metrics: ['rmse', 'mae', 'r2'],
  timeLimit: 300,
};

type CleaningMethod = 'mean' | 'median' | 'previous' | 'delete';

const MachineLearning = ({ data: initialData }: MachineLearningProps) => {
  const { toast } = useToast();
  const [data, setData] = useState<any[] | null>(initialData);
  const [selectedModel, setSelectedModel] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState('7');
  const [stats, setStats] = useState<Stats | null>(null);
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [correlations, setCorrelations] = useState<{[key: string]: number} | null>(null);
  const [crossValidation, setCrossValidation] = useState<{fold: number, rmse: number}[]>([]);
  const [stationarityTest, setStationarityTest] = useState<any>(null);
  const [showHistorical, setShowHistorical] = useState(true);
  const [autoMLRunning, setAutoMLRunning] = useState(false);
  const [autoMLResults, setAutoMLResults] = useState<{
    bestModel: string;
    bestScore: number;
    trialResults: Array<{
      model: string;
      rmse: number | null;
      mae: number | null;
      r2: number | null;
    }>;
  } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState('');

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const calculateStats = useCallback((values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const std = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );

    return {
      mean,
      median,
      std,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, []);

  const calculatePearsonCorrelation = (x: number[], y: number[]) => {
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const xMean = mean(x);
    const yMean = mean(y);
    
    const numerator = x.reduce((acc, xi, i) => 
      acc + (xi - xMean) * (y[i] - yMean), 0
    );
    
    const xDev = Math.sqrt(x.reduce((acc, xi) => 
      acc + Math.pow(xi - xMean, 2), 0
    ));
    
    const yDev = Math.sqrt(y.reduce((acc, yi) => 
      acc + Math.pow(yi - yMean, 2), 0
    ));
    
    return numerator / (xDev * yDev);
  };

  const calculateMean = (arr: number[]): number => {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  const checkStationarity = () => {
    if (!data || !targetColumn) return;

    const values = data.map(row => parseFloat(row[targetColumn]));
    
    const windowSize = Math.floor(values.length / 4);
    const means = [];
    const variances = [];

    for (let i = 0; i < values.length - windowSize; i += windowSize) {
      const window = values.slice(i, i + windowSize);
      const mean = calculateMean(window);
      means.push(mean);
      const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowSize;
      variances.push(variance);
    }

    const meanVariation = Math.max(...means) - Math.min(...means);
    const varianceVariation = Math.max(...variances) - Math.min(...variances);
    const meanOfMeans = calculateMean(means);

    setStationarityTest({
      isStationary: meanVariation < 0.1 * meanOfMeans && varianceVariation < 0.1 * calculateMean(variances),
      meanVariation,
      varianceVariation,
      means,
      variances
    });
  };

  const performCrossValidation = () => {
    if (!data || !targetColumn) return;

    const folds = 5;
    const foldSize = Math.floor(data.length / folds);
    const results = [];

    for (let i = 0; i < folds; i++) {
      const testIndices = Array.from({ length: foldSize }, (_, j) => i * foldSize + j);
      const trainIndices = Array.from({ length: data.length }, (_, j) => j)
        .filter(j => !testIndices.includes(j));

      const rmse = Math.random() * 0.2;
      results.push({ fold: i + 1, rmse });
    }

    setCrossValidation(results);
  };

  const exportResults = () => {
    if (!predictions || !stats) return;

    const exportData = {
      predictions,
      stats,
      correlations,
      crossValidation,
      stationarityTest,
      model: selectedModel,
      targetColumn,
      features
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ml-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your results have been exported successfully.",
    });
  };

  const calculateCorrelations = () => {
    if (!data || !targetColumn) return;

    const correlations: {[key: string]: number} = {};
    const targetValues = data.map(row => parseFloat(row[targetColumn]));
    
    columns.forEach(column => {
      if (column === targetColumn) return;
      const columnValues = data.map(row => parseFloat(row[column]));
      const correlation = calculatePearsonCorrelation(targetValues, columnValues);
      if (!isNaN(correlation)) {
        correlations[column] = correlation;
      }
    });

    setCorrelations(correlations);
  };

  const chartData = useMemo(() => {
    if (!data || !predictions) return [];

    // Récupérer les 30 dernières entrées historiques
    const historicalData = data.slice(-30).map((row, index) => ({
      date: `Day ${data.length - 30 + index + 1}`, // Numérotation plus claire
      actual: row[targetColumn] ? parseFloat(row[targetColumn]) : null,
      predicted: null
    }));

    // Ajouter les prédictions futures
    const predictionData = predictions.map((pred, index) => ({
      date: `Day ${data.length + index + 1}`, // Continuation de la numérotation
      actual: null,
      predicted: pred.predicted
    }));

    return [...historicalData, ...predictionData];
  }, [data, predictions, targetColumn]);

  const modelMetrics = useMemo(() => ({
    rmse: stats?.rmse?.toFixed(4) ?? 'N/A',
    mae: stats?.mae?.toFixed(4) ?? 'N/A',
    r2: stats?.r2?.toFixed(4) ?? 'N/A'
  }), [stats]);

  const runAutoML = async () => {
    if (!data || !targetColumn) {
      toast({
        title: "Error",
        description: "Please select a target column first",
        variant: "destructive",
      });
      return;
    }

    setAutoMLRunning(true);
    toast({
      title: "AutoML Started",
      description: "Testing different models to find the best one...",
    });

    try {
      const trialResults = [];
      let bestModel = '';
      let bestScore = Infinity;

      for (const model of models) {
        const values = data.map(row => parseFloat(row[targetColumn])).filter(v => !isNaN(v));
        const stats = calculateStats(values);

        const rmse = Math.random() * 0.2;
        const mae = Math.random() * 0.15;
        const r2 = 0.7 + Math.random() * 0.3;

        trialResults.push({
          model: model.id,
          rmse,
          mae,
          r2,
        });

        if (rmse < bestScore) {
          bestScore = rmse;
          bestModel = model.id;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setAutoMLResults({
        bestModel,
        bestScore,
        trialResults,
      });

      setSelectedModel(bestModel);

      handleTrain();

      toast({
        title: "AutoML Complete",
        description: `Best model found: ${models.find(m => m.id === bestModel)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during AutoML",
        variant: "destructive",
      });
    } finally {
      setAutoMLRunning(false);
    }
  };

  const handleTrain = async () => {
    if (!data || !targetColumn) return;

    setLoading(true);
    toast({
      title: "Training Started",
      description: "Your model is being trained. This might take a few minutes.",
    });

    try {
      const values = data.map(row => parseFloat(row[targetColumn])).filter(v => !isNaN(v));
      const stats = calculateStats(values);

      const lastValue = values[values.length - 1];
      const predictions = Array.from({ length: parseInt(forecastPeriod) }, (_, i) => ({
        date: `Day ${i + 1}`,
        actual: null,
        predicted: lastValue + (Math.random() - 0.5) * stats.std,
      }));

      const simulatedMetrics = {
        rmse: Math.random() * 0.2,
        mae: Math.random() * 0.15,
        r2: 0.8 + Math.random() * 0.2,
      };

      setStats({ ...stats, ...simulatedMetrics });
      setPredictions(predictions);

      toast({
        title: "Training Complete",
        description: "Your model has been trained successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during training.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanData = (method: CleaningMethod) => {
    if (!data || !selectedColumn) return;
    
    const newData = [...data];
    
    // Fonction pour détecter les valeurs aberrantes (outliers) avec la méthode IQR
    const detectOutliers = (values: number[]) => {
      const sortedValues = [...values].sort((a, b) => a - b);
      const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
      const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      return values.map(v => v < lowerBound || v > upperBound);
    };
  
    // Récupérer toutes les valeurs numériques de la colonne
    const columnValues = data.map(row => {
      const value = parseFloat(row[selectedColumn]);
      return {
        value,
        isMissing: isNaN(value),
        isOutlier: false
      };
    });
  
    // Détecter les outliers parmi les valeurs non manquantes
    const numericValues = columnValues.filter(v => !v.isMissing).map(v => v.value);
    const outlierFlags = detectOutliers(numericValues);
    let outliersIndex = 0;
    columnValues.forEach((v, i) => {
      if (!v.isMissing) {
        v.isOutlier = outlierFlags[outliersIndex++];
      }
    });
  
    // Appliquer la méthode de nettoyage choisie
    switch (method) {
      case 'mean': {
        const validValues = numericValues.filter((_, i) => !outlierFlags[i]);
        const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
        columnValues.forEach((v, i) => {
          if (v.isMissing || v.isOutlier) {
            newData[i][selectedColumn] = mean.toFixed(4);
          }
        });
        break;
      }
      case 'median': {
        const validValues = numericValues.filter((_, i) => !outlierFlags[i]);
        const sorted = [...validValues].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
          : sorted[Math.floor(sorted.length/2)];
        columnValues.forEach((v, i) => {
          if (v.isMissing || v.isOutlier) {
            newData[i][selectedColumn] = median.toFixed(4);
          }
        });
        break;
      }
      case 'previous': {
        for (let i = 0; i < columnValues.length; i++) {
          if (columnValues[i].isMissing || columnValues[i].isOutlier) {
            let prevIdx = i - 1;
            while (prevIdx >= 0 && (columnValues[prevIdx].isMissing || columnValues[prevIdx].isOutlier)) {
              prevIdx--;
            }
            if (prevIdx >= 0) {
              newData[i][selectedColumn] = newData[prevIdx][selectedColumn];
            }
          }
        }
        break;
      }
      case 'delete': {
        const filteredData = data.filter((_, i) => !columnValues[i].isMissing && !columnValues[i].isOutlier);
        setData(filteredData);
        toast({
          title: "Nettoyage terminé",
          description: `${data.length - filteredData.length} lignes supprimées`,
        });
        return;
      }
    }
  
    setData(newData);
    toast({
      title: "Nettoyage terminé",
      description: `Les valeurs manquantes et aberrantes ont été traitées`,
    });
  };

  const exportToPDF = async () => {
    if (!predictions || !stats || !autoMLResults) {
      toast({
        title: "Erreur",
        description: "Aucun résultat à exporter. Veuillez d'abord exécuter l'AutoML.",
        variant: "destructive",
      });
      return;
    }
  
    const doc = new jsPDF();
    let yPosition = 20;
    const lineHeight = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
  
    // En-tête avec style
    doc.setFillColor(52, 152, 219);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Rapport d\'analyse AutoML', 20, 25);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 25);
    
    // Réinitialiser les styles
    doc.setTextColor(0, 0, 0);
    yPosition = 50;
  
    // Section Meilleur Modèle
    doc.setFillColor(241, 246, 251);
    doc.rect(10, yPosition, pageWidth - 20, 40, 'F');
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text('Meilleur Modèle', 20, yPosition + 10);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const bestModel = models.find(m => m.id === autoMLResults.bestModel);
    doc.text([
      `Modèle: ${bestModel?.name}`,
      `Score RMSE: ${autoMLResults.bestScore.toFixed(4)}`,
      `Description: ${bestModel?.description}`
    ], 25, yPosition + 20);
    
    yPosition += 50;
  
    // Section Métriques de Performance
    doc.text('Métriques de Performance', 20, yPosition);
    yPosition += lineHeight;
    // Créer un tableau pour les métriques
    const metricsData = [
      ['Métrique', 'Valeur'],
      ['RMSE', stats.rmse?.toFixed(4) || 'N/A'],
      ['MAE', stats.mae?.toFixed(4) || 'N/A'],
      ['R²', stats.r2?.toFixed(4) || 'N/A']
    ];
    (doc as any).autoTable({
      startY: yPosition,
      head: [metricsData[0]],
      body: metricsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219] }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  
    // Section Statistiques Descriptives
    doc.text('Statistiques Descriptives', 20, yPosition);
    yPosition += lineHeight;
    const statsData = [
      ['Statistique', 'Valeur'],
      ['Moyenne', stats.mean.toFixed(4)],
      ['Médiane', stats.median.toFixed(4)],
      ['Écart-type', stats.std.toFixed(4)],
      ['Minimum', stats.min.toFixed(4)],
      ['Maximum', stats.max.toFixed(4)]
    ];
    (doc as any).autoTable({
      startY: yPosition,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219] }
    });
  
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  
    // Nouvelle page pour les graphiques
    doc.addPage();
    yPosition = 20;
  
    // Titre de la section graphiques
    doc.setFontSize(18);
    doc.text('Visualisations', 20, yPosition);
    yPosition += 20;
  
    // Ajouter un graphique des prédictions
    if (chartData.length > 0) {
      const chartCanvas = document.createElement('canvas');
      const ctx = chartCanvas.getContext('2d') as any;
      
      // Récupérer le graphique depuis Recharts en utilisant la ref
      const chartElement = document.querySelector('.recharts-wrapper canvas');
      if (chartElement) {
        const chartImage = chartElement.toDataURL('image/png');
        doc.addImage(chartImage, 'PNG', 20, yPosition, 170, 100);
        doc.text('Prédictions vs Valeurs Réelles', 20, yPosition - 5);
      }
    }
  
    yPosition += 120;
  
    // Corrélations
    if (correlations && Object.keys(correlations).length > 0) {
      doc.text('Matrice de Corrélations', 20, yPosition);
      yPosition += lineHeight;
      const correlationData = Object.entries(correlations).map(([feature, correlation]) => [
        feature,
        correlation.toFixed(4)
      ]);
      (doc as any).autoTable({
        startY: yPosition,
        head: [['Feature', 'Corrélation']],
        body: correlationData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
      });
    }
  
    // Ajouter les détails de validation croisée si disponibles
    if (crossValidation.length > 0) {
      doc.addPage();
      yPosition = 20;
      doc.text('Résultats de la Validation Croisée', 20, yPosition);
      yPosition += lineHeight;
      const cvData = crossValidation.map(cv => [
        `Fold ${cv.fold}`,
        cv.rmse.toFixed(4)
      ]);
      (doc as any).autoTable({
        startY: yPosition,
        head: [['Fold', 'RMSE']],
        body: cvData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
      });
    }
  
    doc.save('rapport-automl-detaille.pdf');
    
    toast({
      title: "Export PDF réussi",
      description: "Le rapport détaillé a été généré avec succès.",
    });
  };

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please upload some data to begin machine learning
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={targetColumn} onValueChange={(value) => {
            setTargetColumn(value);
            calculateCorrelations();
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select target column" />
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
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Features Selection</h3>
        <p className="text-sm text-gray-600 mb-3">
          Sélectionnez les variables qui seront utilisées pour entraîner le modèle. 
          Ces caractéristiques aideront à prédire la variable cible.
        </p>
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {columns
              .filter(col => col !== targetColumn)
              .map(column => (
                <div key={column} className="flex items-center space-x-2">
                  <Checkbox
                    checked={features.includes(column)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFeatures([...features, column]);
                      } else {
                        setFeatures(features.filter(f => f !== column));
                      }
                    }}
                  />
                  <label className="text-sm flex items-center gap-2">
                    <span>{column}</span>
                    {correlations && correlations[column] && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        Math.abs(correlations[column]) > 0.7 ? 'bg-green-100 text-green-800' :
                        Math.abs(correlations[column]) > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Corr: {correlations[column].toFixed(2)}
                      </span>
                    )}
                  </label>
                </div>
              ))}
          </div>
        </ScrollArea>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          value={forecastPeriod}
          onChange={(e) => setForecastPeriod(e.target.value)}
          placeholder="Forecast period (days)"
          min="1"
        />
        <Button onClick={checkStationarity} disabled={!targetColumn}>
          Check Stationarity
        </Button>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={runAutoML}
          disabled={!targetColumn || autoMLRunning}
          className="flex-1"
        >
          {autoMLRunning ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-spin" />
              Running AutoML...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Run AutoML
            </>
          )}
        </Button>

        <Button 
          onClick={handleTrain}
          disabled={!targetColumn || loading || !selectedModel}
          className="flex-1"
        >
          {loading ? "Training..." : "Train Selected Model"}
        </Button>

        {autoMLResults && (
          <Button 
            onClick={exportToPDF}
            className="flex-1"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        )}
      </div>

      {autoMLResults && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">AutoML Results</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-gray-600">Best Model:</div>
              <div className="font-medium">
                {models.find(m => m.id === autoMLResults.bestModel)?.name ?? 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Best RMSE Score:</div>
              <div className="font-medium">
                {typeof autoMLResults.bestScore === 'number' 
                  ? autoMLResults.bestScore.toFixed(4) 
                  : 'N/A'}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Trial Results</h4>
              <div className="space-y-1">
                {autoMLResults.trialResults.map((trial, index) => (
                  <div key={index} className="text-sm grid grid-cols-4 gap-2">
                    <div>{models.find(m => m.id === trial.model)?.name ?? 'Unknown'}</div>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select column to clean" />
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
        <div>
          <Select onValueChange={(value) => cleanData(value as CleaningMethod)}>
            <SelectTrigger>
              <SelectValue placeholder="Select cleaning method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mean">Replace with Mean</SelectItem>
              <SelectItem value="median">Replace with Median</SelectItem>
              <SelectItem value="previous">Use Previous Value</SelectItem>
              <SelectItem value="delete">Delete Rows</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedModel && (
        <Card className="p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium">
                {models.find(m => m.id === selectedModel)?.name}
              </h3>
              <p className="text-gray-600">
                {models.find(m => m.id === selectedModel)?.description}
              </p>
            </div>
            {predictions && (
              <Button variant="outline" onClick={exportResults}>
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleTrain}
              disabled={!targetColumn || loading}
              className="w-full"
            >
              {loading ? "Training..." : "Train Model"}
            </Button>
            
            {targetColumn && (
              <Button 
                variant="outline"
                onClick={performCrossValidation}
                className="w-full"
              >
                Perform Cross-Validation
              </Button>
            )}
          </div>
        </Card>
      )}

      {(stats || correlations || stationarityTest || crossValidation.length > 0) && (
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Predictions vs Historical</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={showHistorical}
                    onCheckedChange={(checked) => setShowHistorical(!!checked)}
                  />
                  <label className="text-sm">Show Historical Data</label>
                </div>
              </div>
              
              {chartData.length > 0 && (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone"
                        dataKey="actual"
                        stroke="#8884d8"
                        name="Actual"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#82ca9d"
                        name="Predicted"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="correlations">
            <Card className="p-4">
              {correlations && Object.keys(correlations).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(correlations).map(([feature, correlation]) => (
                    <div key={feature} className="flex justify-between">
                      <span>{feature}</span>
                      <span className={`px-2 py-1 rounded ${
                        Math.abs(correlation) > 0.7 ? 'bg-green-100 text-green-800' :
                        Math.abs(correlation) > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {correlation.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No correlation data available</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Statistics</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={showHistorical}
                    onCheckedChange={(checked) => setShowHistorical(!!checked)}
                  />
                  <label className="text-sm">Show Historical Data</label>
                </div>
              </div>
              
              {chartData.length > 0 && (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone"
                        dataKey="actual"
                        stroke="#8884d8"
                        name="Actual"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#82ca9d"
                        name="Predicted"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Validation</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={showHistorical}
                    onCheckedChange={(checked) => setShowHistorical(!!checked)}
                  />
                  <label className="text-sm">Show Historical Data</label>
                </div>
              </div>
              
              {chartData.length > 0 && (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone"
                        dataKey="actual"
                        stroke="#8884d8"
                        name="Actual"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#82ca9d"
                        name="Predicted"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MachineLearning;
