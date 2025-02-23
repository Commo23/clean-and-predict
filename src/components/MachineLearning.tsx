
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface MachineLearningProps {
  data: any[] | null;
}

const models = [
  { id: 'arima', name: 'ARIMA/SARIMA', description: 'For time series forecasting with seasonality' },
  { id: 'prophet', name: 'Prophet', description: 'Facebook\'s time series forecasting tool' },
  { id: 'lstm', name: 'LSTM', description: 'Deep learning for sequence prediction' },
  { id: 'randomforest', name: 'Random Forest', description: 'Ensemble learning method' },
  { id: 'xgboost', name: 'XGBoost', description: 'Gradient boosting framework' }
];

const MachineLearning = ({ data }: MachineLearningProps) => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [loading, setLoading] = useState(false);

  const columns = data ? Object.keys(data[0] || {}) : [];

  const handleTrain = async () => {
    setLoading(true);
    toast({
      title: "Training Started",
      description: "Your model is being trained. This might take a few minutes.",
    });
    
    // TODO: Implement actual model training
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Training Complete",
        description: "Your model has been trained successfully!",
      });
    }, 3000);
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

      <div className="text-sm text-gray-500">
        Note: This is a demonstration version. In a production environment,
        you would need to implement proper model training and validation.
      </div>
    </div>
  );
};

export default MachineLearning;
