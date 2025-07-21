import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Info
} from 'lucide-react';
import { DataRow, ColumnQualityReport } from '@/types';
import { getNumericValues, isNumericColumn, isDateColumn } from '@/utils/typeUtils';
import { exportQualityReport } from '@/utils/exportUtils';
import { DataSet } from '@/types';

interface AdvancedStatsProps {
  dataSet: DataSet | null;
  qualityReport: ColumnQualityReport[];
}

const AdvancedStats = ({ dataSet, qualityReport }: AdvancedStatsProps) => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const overallStats = useMemo(() => {
    if (!dataSet || !qualityReport.length) return null;

    const totalColumns = qualityReport.length;
    const columnsWithIssues = qualityReport.filter(col => 
      col.stats.missingPercentage > 0 || col.stats.outliersPercentage > 0
    ).length;
    
    const averageMissing = qualityReport.reduce((sum, col) => sum + col.stats.missingPercentage, 0) / totalColumns;
    const averageOutliers = qualityReport.reduce((sum, col) => sum + col.stats.outliersPercentage, 0) / totalColumns;
    
    const dataQualityScore = Math.max(0, 100 - (averageMissing + averageOutliers));
    
    return {
      totalColumns,
      columnsWithIssues,
      averageMissing,
      averageOutliers,
      dataQualityScore,
      numericColumns: qualityReport.filter(col => isNumericColumn(dataSet.data, col.column)).length,
      dateColumns: qualityReport.filter(col => isDateColumn(dataSet.data, col.column)).length,
      categoricalColumns: totalColumns - qualityReport.filter(col => 
        isNumericColumn(dataSet.data, col.column) || isDateColumn(dataSet.data, col.column)
      ).length
    };
  }, [dataSet, qualityReport]);

  const columnDetails = useMemo(() => {
    if (!selectedColumn || !dataSet) return null;

    const columnData = dataSet.data.map(row => row[selectedColumn]);
    const numericValues = getNumericValues(dataSet.data, selectedColumn);
    
    if (numericValues.length === 0) return null;

    const sorted = [...numericValues].sort((a, b) => a - b);
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const std = Math.sqrt(
      numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length
    );
    
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    return {
      mean,
      median,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      q1,
      q3,
      iqr,
      skewness: numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / numericValues.length,
      kurtosis: numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / numericValues.length - 3
    };
  }, [selectedColumn, dataSet]);

  const handleExportReport = () => {
    if (!dataSet) return;
    exportQualityReport(dataSet, qualityReport);
  };

  if (!dataSet || !overallStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques Avancées
          </CardTitle>
          <CardDescription>
            Aucune donnée disponible pour l'analyse
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistiques Avancées
            </CardTitle>
            <CardDescription>
              Analyse détaillée de la qualité et des caractéristiques de vos données
            </CardDescription>
          </div>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter Rapport
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="quality">Qualité</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{overallStats.totalColumns}</div>
                <div className="text-sm text-muted-foreground">Colonnes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{overallStats.numericColumns}</div>
                <div className="text-sm text-muted-foreground">Numériques</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{overallStats.dateColumns}</div>
                <div className="text-sm text-muted-foreground">Dates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{overallStats.categoricalColumns}</div>
                <div className="text-sm text-muted-foreground">Catégorielles</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de qualité des données</span>
                <span className="text-sm font-bold">{overallStats.dataQualityScore.toFixed(1)}%</span>
              </div>
              <Progress value={overallStats.dataQualityScore} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {overallStats.dataQualityScore >= 80 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
                {overallStats.dataQualityScore >= 80 
                  ? 'Excellente qualité' 
                  : overallStats.dataQualityScore >= 60 
                    ? 'Qualité acceptable' 
                    : 'Qualité à améliorer'
                }
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <div className="space-y-4">
              {qualityReport.map((col) => (
                <div key={col.column} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{col.column}</h4>
                    <div className="flex gap-2">
                      {col.stats.missingPercentage > 0 && (
                        <Badge variant="destructive">
                          {col.stats.missingPercentage.toFixed(1)}% manquantes
                        </Badge>
                      )}
                      {col.stats.outliersPercentage > 0 && (
                        <Badge variant="secondary">
                          {col.stats.outliersPercentage.toFixed(1)}% aberrantes
                        </Badge>
                      )}
                      {col.stats.missingPercentage === 0 && col.stats.outliersPercentage === 0 && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Parfait
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Moyenne:</span>
                      <div className="font-medium">{col.stats.mean.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Médiane:</span>
                      <div className="font-medium">{col.stats.median.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Écart-type:</span>
                      <div className="font-medium">{col.stats.std.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plage:</span>
                      <div className="font-medium">{col.stats.min.toFixed(2)} - {col.stats.max.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sélectionner une colonne numérique:</label>
                <select 
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedColumn || ''}
                  onChange={(e) => setSelectedColumn(e.target.value || null)}
                >
                  <option value="">Choisir une colonne...</option>
                  {qualityReport
                    .filter(col => isNumericColumn(dataSet.data, col.column))
                    .map(col => (
                      <option key={col.column} value={col.column}>
                        {col.column}
                      </option>
                    ))
                  }
                </select>
              </div>

              {columnDetails && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Statistiques détaillées pour {selectedColumn}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Moyenne</span>
                      <div className="font-medium">{columnDetails.mean.toFixed(4)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Médiane</span>
                      <div className="font-medium">{columnDetails.median.toFixed(4)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Écart-type</span>
                      <div className="font-medium">{columnDetails.std.toFixed(4)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Asymétrie</span>
                      <div className="font-medium">{columnDetails.skewness.toFixed(4)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Aplatissement</span>
                      <div className="font-medium">{columnDetails.kurtosis.toFixed(4)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">IQR</span>
                      <div className="font-medium">{columnDetails.iqr.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedStats; 