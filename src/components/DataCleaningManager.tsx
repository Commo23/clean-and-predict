import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  BarChart3,
  Settings,
  Play
} from 'lucide-react';
import { DataSet } from '@/types';

interface DataCleaningManagerProps {
  dataSet: DataSet | null;
  onDataCleaned: (cleanedData: DataSet) => void;
}

interface MissingValueConfig {
  method: 'mean' | 'median' | 'mode' | 'remove' | 'forward_fill' | 'backward_fill' | 'custom';
  customValue?: string | number;
  applyToAll: boolean;
  selectedColumns: string[];
}

interface OutlierConfig {
  method: 'iqr' | 'zscore';
  threshold: number;
  applyToAll: boolean;
  selectedColumns: string[];
}

interface NormalizationConfig {
  method: 'minmax' | 'zscore' | 'robust';
  applyToAll: boolean;
  selectedColumns: string[];
}

const DataCleaningManager: React.FC<DataCleaningManagerProps> = ({ dataSet, onDataCleaned }) => {
  const [activeTab, setActiveTab] = useState('missing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [missingConfig, setMissingConfig] = useState<MissingValueConfig>({
    method: 'mean',
    applyToAll: true,
    selectedColumns: []
  });
  const [outlierConfig, setOutlierConfig] = useState<OutlierConfig>({
    method: 'iqr',
    threshold: 1.5,
    applyToAll: true,
    selectedColumns: []
  });
  const [normalizationConfig, setNormalizationConfig] = useState<NormalizationConfig>({
    method: 'minmax',
    applyToAll: true,
    selectedColumns: []
  });

  const [missingStats, setMissingStats] = useState<Record<string, number>>({});
  const [outlierStats, setOutlierStats] = useState<Record<string, number>>({});

  // Analyser les données pour les statistiques
  useEffect(() => {
    if (dataSet) {
      analyzeMissingValues();
      analyzeOutliers();
    }
  }, [dataSet]);

  const analyzeMissingValues = () => {
    if (!dataSet?.data || !dataSet?.columns) return;

    const stats: Record<string, number> = {};
    dataSet.columns.forEach((column, colIndex) => {
      let missingCount = 0;
      dataSet.data.forEach(row => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }
        
        if (value === null || value === undefined || value === '' || 
            (typeof value === 'string' && value.toLowerCase() === 'nan')) {
          missingCount++;
        }
      });
      stats[column] = missingCount;
    });
    setMissingStats(stats);
  };

  const analyzeOutliers = () => {
    if (!dataSet?.data || !dataSet?.columns) return;

    const stats: Record<string, number> = {};
    dataSet.columns.forEach((column, colIndex) => {
      const values: number[] = [];
      dataSet.data.forEach(row => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }
        
        if (typeof value === 'number' && !isNaN(value)) {
          values.push(value);
        }
      });

      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const outliers = values.filter(v => v < lowerBound || v > upperBound);
        stats[column] = outliers.length;
      } else {
        stats[column] = 0;
      }
    });
    setOutlierStats(stats);
  };

  const handleMissingValueMethodChange = (method: string) => {
    setMissingConfig(prev => ({
      ...prev,
      method: method as MissingValueConfig['method']
    }));
  };

  const handleColumnSelection = (column: string, type: 'missing' | 'outlier' | 'normalization') => {
    if (type === 'missing') {
      setMissingConfig(prev => ({
        ...prev,
        selectedColumns: prev.selectedColumns.includes(column)
          ? prev.selectedColumns.filter(col => col !== column)
          : [...prev.selectedColumns, column]
      }));
    } else if (type === 'outlier') {
      setOutlierConfig(prev => ({
        ...prev,
        selectedColumns: prev.selectedColumns.includes(column)
          ? prev.selectedColumns.filter(col => col !== column)
          : [...prev.selectedColumns, column]
      }));
    } else if (type === 'normalization') {
      setNormalizationConfig(prev => ({
        ...prev,
        selectedColumns: prev.selectedColumns.includes(column)
          ? prev.selectedColumns.filter(col => col !== column)
          : [...prev.selectedColumns, column]
      }));
    }
  };

  const processMissingValues = (data: any[], columns: string[]) => {
    const processedData = [...data];
    
    const targetColumns = missingConfig.applyToAll 
      ? columns 
      : missingConfig.selectedColumns;

    targetColumns.forEach(column => {
      const colIndex = columns.indexOf(column);
      if (colIndex === -1) return;

      // Collecter les valeurs non-manquantes pour calculer les statistiques
      const validValues: number[] = [];
      processedData.forEach(row => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }
        
        if (typeof value === 'number' && !isNaN(value)) {
          validValues.push(value);
        }
      });

      // Calculer les statistiques
      const mean = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
      const sorted = [...validValues].sort((a, b) => a - b);
      const median = sorted.length > 0 
        ? sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        : 0;

      // Traiter chaque ligne
      processedData.forEach((row, rowIndex) => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }

        const isMissing = value === null || value === undefined || value === '' || 
                         (typeof value === 'string' && value.toLowerCase() === 'nan');

        if (isMissing) {
          let replacementValue;
          switch (missingConfig.method) {
            case 'mean':
              replacementValue = mean;
              break;
            case 'median':
              replacementValue = median;
              break;
            case 'mode':
              // Mode simple - prendre la valeur la plus fréquente
              const frequency: Record<number, number> = {};
              validValues.forEach(v => {
                frequency[v] = (frequency[v] || 0) + 1;
              });
              replacementValue = Object.entries(frequency)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || mean;
              break;
            case 'remove':
              // Marquer pour suppression
              processedData[rowIndex] = null;
              break;
            case 'forward_fill':
              // Utiliser la valeur précédente
              for (let i = rowIndex - 1; i >= 0; i--) {
                const prevRow = processedData[i];
                if (prevRow === null) continue;
                
                let prevValue;
                if (Array.isArray(prevRow)) {
                  prevValue = prevRow[colIndex];
                } else if (typeof prevRow === 'object' && prevRow !== null) {
                  prevValue = prevRow[column];
                } else {
                  prevValue = prevRow;
                }
                
                if (prevValue !== null && prevValue !== undefined && prevValue !== '') {
                  replacementValue = prevValue;
                  break;
                }
              }
              break;
            case 'backward_fill':
              // Utiliser la valeur suivante
              for (let i = rowIndex + 1; i < processedData.length; i++) {
                const nextRow = processedData[i];
                if (nextRow === null) continue;
                
                let nextValue;
                if (Array.isArray(nextRow)) {
                  nextValue = nextRow[colIndex];
                } else if (typeof nextRow === 'object' && nextRow !== null) {
                  nextValue = nextRow[column];
                } else {
                  nextValue = nextRow;
                }
                
                if (nextValue !== null && nextValue !== undefined && nextValue !== '') {
                  replacementValue = nextValue;
                  break;
                }
              }
              break;
            case 'custom':
              replacementValue = missingConfig.customValue || 0;
              break;
            default:
              replacementValue = mean;
          }

          // Appliquer la valeur de remplacement
          if (Array.isArray(row)) {
            processedData[rowIndex][colIndex] = replacementValue;
          } else if (typeof row === 'object' && row !== null) {
            processedData[rowIndex][column] = replacementValue;
          }
        }
      });
    });

    // Supprimer les lignes marquées pour suppression
    return processedData.filter(row => row !== null);
  };

  const processOutliers = (data: any[], columns: string[]) => {
    const processedData = [...data];
    
    const targetColumns = outlierConfig.applyToAll 
      ? columns 
      : outlierConfig.selectedColumns;

    targetColumns.forEach(column => {
      const colIndex = columns.indexOf(column);
      if (colIndex === -1) return;

      // Collecter les valeurs numériques
      const values: number[] = [];
      processedData.forEach(row => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }
        
        if (typeof value === 'number' && !isNaN(value)) {
          values.push(value);
        }
      });

      if (values.length === 0) return;

      // Calculer les bornes selon la méthode choisie
      let lowerBound: number, upperBound: number;
      
      if (outlierConfig.method === 'iqr') {
        const sorted = values.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        lowerBound = q1 - outlierConfig.threshold * iqr;
        upperBound = q3 + outlierConfig.threshold * iqr;
      } else {
        // Méthode Z-score
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        lowerBound = mean - outlierConfig.threshold * stdDev;
        upperBound = mean + outlierConfig.threshold * stdDev;
      }

      // Appliquer le traitement des outliers
      processedData.forEach((row, rowIndex) => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }

        if (typeof value === 'number' && (value < lowerBound || value > upperBound)) {
          // Remplacer par la borne la plus proche
          const replacementValue = value < lowerBound ? lowerBound : upperBound;
          
          if (Array.isArray(row)) {
            processedData[rowIndex][colIndex] = replacementValue;
          } else if (typeof row === 'object' && row !== null) {
            processedData[rowIndex][column] = replacementValue;
          }
        }
      });
    });

    return processedData;
  };

  const processNormalization = (data: any[], columns: string[]) => {
    const processedData = [...data];
    
    const targetColumns = normalizationConfig.applyToAll 
      ? columns 
      : normalizationConfig.selectedColumns;

    targetColumns.forEach(column => {
      const colIndex = columns.indexOf(column);
      if (colIndex === -1) return;

      // Collecter les valeurs numériques
      const values: number[] = [];
      processedData.forEach(row => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }
        
        if (typeof value === 'number' && !isNaN(value)) {
          values.push(value);
        }
      });

      if (values.length === 0) return;

      // Calculer les statistiques pour la normalisation
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Calculer les quartiles pour la normalisation robuste
      const sorted = values.sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;

      // Appliquer la normalisation
      processedData.forEach((row, rowIndex) => {
        let value;
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[column];
        } else {
          value = row;
        }

        if (typeof value === 'number' && !isNaN(value)) {
          let normalizedValue;
          
          switch (normalizationConfig.method) {
            case 'minmax':
              normalizedValue = (value - min) / (max - min);
              break;
            case 'zscore':
              normalizedValue = (value - mean) / stdDev;
              break;
            case 'robust':
              normalizedValue = (value - q1) / iqr;
              break;
            default:
              normalizedValue = value;
          }

          if (Array.isArray(row)) {
            processedData[rowIndex][colIndex] = normalizedValue;
          } else if (typeof row === 'object' && row !== null) {
            processedData[rowIndex][column] = normalizedValue;
          }
        }
      });
    });

    return processedData;
  };

  const handleProcessData = async () => {
    if (!dataSet) return;

    setIsProcessing(true);
    
    try {
      let processedData = [...dataSet.data];

      // Traiter les valeurs manquantes
      if (activeTab === 'missing' || missingConfig.selectedColumns.length > 0 || missingConfig.applyToAll) {
        processedData = processMissingValues(processedData, dataSet.columns || []);
      }

      // Traiter les outliers
      if (activeTab === 'outliers' || outlierConfig.selectedColumns.length > 0 || outlierConfig.applyToAll) {
        processedData = processOutliers(processedData, dataSet.columns || []);
      }

      // Traiter la normalisation
      if (activeTab === 'normalization' || normalizationConfig.selectedColumns.length > 0 || normalizationConfig.applyToAll) {
        processedData = processNormalization(processedData, dataSet.columns || []);
      }

      const cleanedDataSet: DataSet = {
        ...dataSet,
        data: processedData
      };

      onDataCleaned(cleanedDataSet);
    } catch (error) {
      console.error('Erreur lors du traitement des données:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!dataSet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Nettoyage des Données
          </CardTitle>
          <CardDescription>
            Aucune donnée disponible pour le nettoyage
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalMissing = Object.values(missingStats).reduce((sum, count) => sum + count, 0);
  const totalOutliers = Object.values(outlierStats).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Options de Nettoyage des Données
        </CardTitle>
        <CardDescription>
          Configurez comment vos données doivent être prétraitées
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="missing" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Valeurs Manquantes
              {totalMissing > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {totalMissing}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outliers" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Outliers
              {totalOutliers > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {totalOutliers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="normalization" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Normalisation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missing" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="missing-method">Méthode</Label>
                <Select value={missingConfig.method} onValueChange={handleMissingValueMethodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mean">Imputation par la moyenne</SelectItem>
                    <SelectItem value="median">Imputation par la médiane</SelectItem>
                    <SelectItem value="mode">Imputation par le mode</SelectItem>
                    <SelectItem value="remove">Supprimer les lignes</SelectItem>
                    <SelectItem value="forward_fill">Remplissage avant</SelectItem>
                    <SelectItem value="backward_fill">Remplissage arrière</SelectItem>
                    <SelectItem value="custom">Valeur personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {missingConfig.method === 'custom' && (
                <div>
                  <Label htmlFor="custom-value">Valeur personnalisée</Label>
                  <Input
                    id="custom-value"
                    placeholder="Entrez une valeur"
                    value={missingConfig.customValue || ''}
                    onChange={(e) => setMissingConfig(prev => ({
                      ...prev,
                      customValue: e.target.value
                    }))}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="apply-to-all-missing"
                  checked={missingConfig.applyToAll}
                  onCheckedChange={(checked) => setMissingConfig(prev => ({
                    ...prev,
                    applyToAll: checked
                  }))}
                />
                <Label htmlFor="apply-to-all-missing">Appliquer à toutes les colonnes</Label>
              </div>

              {!missingConfig.applyToAll && (
                <div>
                  <Label>Colonnes à traiter</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {dataSet.columns?.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`missing-${column}`}
                          checked={missingConfig.selectedColumns.includes(column)}
                          onChange={() => handleColumnSelection(column, 'missing')}
                        />
                        <Label htmlFor={`missing-${column}`} className="text-sm">
                          {column} ({missingStats[column] || 0} manquantes)
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="outliers" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="outlier-method">Méthode de détection</Label>
                <Select 
                  value={outlierConfig.method} 
                  onValueChange={(value) => setOutlierConfig(prev => ({
                    ...prev,
                    method: value as OutlierConfig['method']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iqr">Méthode IQR (Interquartile Range)</SelectItem>
                    <SelectItem value="zscore">Score Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="outlier-threshold">Seuil</Label>
                <Input
                  id="outlier-threshold"
                  type="number"
                  step="0.1"
                  value={outlierConfig.threshold}
                  onChange={(e) => setOutlierConfig(prev => ({
                    ...prev,
                    threshold: parseFloat(e.target.value) || 1.5
                  }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="apply-to-all-outliers"
                  checked={outlierConfig.applyToAll}
                  onCheckedChange={(checked) => setOutlierConfig(prev => ({
                    ...prev,
                    applyToAll: checked
                  }))}
                />
                <Label htmlFor="apply-to-all-outliers">Appliquer à toutes les colonnes</Label>
              </div>

              {!outlierConfig.applyToAll && (
                <div>
                  <Label>Colonnes à traiter</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {dataSet.columns?.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`outlier-${column}`}
                          checked={outlierConfig.selectedColumns.includes(column)}
                          onChange={() => handleColumnSelection(column, 'outlier')}
                        />
                        <Label htmlFor={`outlier-${column}`} className="text-sm">
                          {column} ({outlierStats[column] || 0} outliers)
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="normalization" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="normalization-method">Méthode de normalisation</Label>
                <Select 
                  value={normalizationConfig.method} 
                  onValueChange={(value) => setNormalizationConfig(prev => ({
                    ...prev,
                    method: value as NormalizationConfig['method']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minmax">Min-Max Scaling (0-1)</SelectItem>
                    <SelectItem value="zscore">Standardisation (Z-Score)</SelectItem>
                    <SelectItem value="robust">Normalisation robuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="apply-to-all-normalization"
                  checked={normalizationConfig.applyToAll}
                  onCheckedChange={(checked) => setNormalizationConfig(prev => ({
                    ...prev,
                    applyToAll: checked
                  }))}
                />
                <Label htmlFor="apply-to-all-normalization">Appliquer à toutes les colonnes</Label>
              </div>

              {!normalizationConfig.applyToAll && (
                <div>
                  <Label>Colonnes à normaliser</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {dataSet.columns?.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`normalization-${column}`}
                          checked={normalizationConfig.selectedColumns.includes(column)}
                          onChange={() => handleColumnSelection(column, 'normalization')}
                        />
                        <Label htmlFor={`normalization-${column}`} className="text-sm">
                          {column}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setMissingConfig({
                method: 'mean',
                applyToAll: true,
                selectedColumns: []
              });
              setOutlierConfig({
                method: 'iqr',
                threshold: 1.5,
                applyToAll: true,
                selectedColumns: []
              });
              setNormalizationConfig({
                method: 'minmax',
                applyToAll: true,
                selectedColumns: []
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button
            onClick={handleProcessData}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Traiter les Données
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCleaningManager; 