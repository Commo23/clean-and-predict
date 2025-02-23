
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

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

const MachineLearning = ({ data }: MachineLearningProps) => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState('7');
  const [stats, setStats] = useState<Stats | null>(null);
  const [predictions, setPredictions] = useState<any[] | null>(null);

  const columns = data ? Object.keys(data[0] || {}) : [];

  const calculateStats = (values: number[]) => {
    const sorted = values.sort((a, b) => a - b);
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
  };

  const handleTrain = async () => {
    if (!data || !targetColumn) return;

    setLoading(true);
    toast({
      title: "Training Started",
      description: "Your model is being trained. This might take a few minutes.",
    });

    try {
      // Simuler l'entraînement et les prédictions
      const values = data.map(row => parseFloat(row[targetColumn])).filter(v => !isNaN(v));
      const stats = calculateStats(values);

      // Simuler des prédictions
      const lastValue = values[values.length - 1];
      const predictions = Array.from({ length: parseInt(forecastPeriod) }, (_, i) => ({
        date: `Day ${i + 1}`,
        actual: null,
        predicted: lastValue + (Math.random() - 0.5) * stats.std,
      }));

      // Simuler des métriques d'erreur
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

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please upload some data to begin machine learning
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
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

        <Select value={targetColumn} onValueChange={setTargetColumn}>
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

        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={forecastPeriod}
            onChange={(e) => setForecastPeriod(e.target.value)}
            placeholder="Forecast period"
            min="1"
            className="w-full"
          />
          <span className="text-sm text-gray-500">days</span>
        </div>
      </div>

      {selectedModel && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-medium mb-2">
            {models.find(m => m.id === selectedModel)?.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {models.find(m => m.id === selectedModel)?.description}
          </p>
          <Button 
            onClick={handleTrain} 
            disabled={!targetColumn || loading}
            className="w-full"
          >
            {loading ? "Training..." : "Train Model"}
          </Button>
        </Card>
      )}

      {stats && predictions && (
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="metrics">Model Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <Card className="p-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8884d8" 
                      name="Predicted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Statistics</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Mean:</dt>
                      <dd>{stats.mean.toFixed(4)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Median:</dt>
                      <dd>{stats.median.toFixed(4)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Std Dev:</dt>
                      <dd>{stats.std.toFixed(4)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Min:</dt>
                      <dd>{stats.min.toFixed(4)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Max:</dt>
                      <dd>{stats.max.toFixed(4)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Model Performance</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">RMSE:</dt>
                      <dd>{stats.rmse?.toFixed(4)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">MAE:</dt>
                      <dd>{stats.mae?.toFixed(4)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">R²:</dt>
                      <dd>{stats.r2?.toFixed(4)}</dd>
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

export default MachineLearning;
