import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  FileText, 
  Database,
  TrendingUp,
  Calendar,
  Hash
} from 'lucide-react';
import { DataRow, ImportOptions } from '@/types';
import { isNumericColumn, isDateColumn } from '@/utils/typeUtils';

interface ImportPreviewProps {
  data: DataRow[];
  options: ImportOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ColumnAnalysis {
  name: string;
  type: 'numeric' | 'date' | 'categorical' | 'mixed';
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  sampleValues: string[];
  issues: string[];
}

const ImportPreview: React.FC<ImportPreviewProps> = ({ 
  data, 
  options, 
  onConfirm, 
  onCancel 
}) => {
  const [selectedTab, setSelectedTab] = useState<'preview' | 'analysis' | 'issues'>('preview');

  // Analyse des colonnes
  const columnAnalysis = useMemo(() => {
    if (!data || data.length === 0) return [];

    const columns = Object.keys(data[0]);
    return columns.map(col => {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
      const missingCount = data.length - values.length;
      const uniqueValues = [...new Set(values)];
      
      let type: ColumnAnalysis['type'] = 'categorical';
      let issues: string[] = [];

      // Détection du type
      if (isNumericColumn(data, col)) {
        type = 'numeric';
      } else if (isDateColumn(data, col)) {
        type = 'date';
      }

      // Détection des problèmes
      if (missingCount > 0) {
        issues.push(`${missingCount} valeurs manquantes`);
      }
      if (uniqueValues.length === 1) {
        issues.push('Valeur unique (peut-être inutile)');
      }
      if (uniqueValues.length === data.length) {
        issues.push('Toutes les valeurs sont uniques');
      }

      return {
        name: col,
        type,
        missingCount,
        missingPercentage: (missingCount / data.length) * 100,
        uniqueCount: uniqueValues.length,
        sampleValues: uniqueValues.slice(0, 5).map(v => String(v)),
        issues
      };
    });
  }, [data]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const numericCols = columnAnalysis.filter(col => col.type === 'numeric').length;
    const dateCols = columnAnalysis.filter(col => col.type === 'date').length;
    const categoricalCols = columnAnalysis.filter(col => col.type === 'categorical').length;
    const totalIssues = columnAnalysis.reduce((sum, col) => sum + col.issues.length, 0);

    return {
      totalRows: data.length,
      totalColumns: columnAnalysis.length,
      numericCols,
      dateCols,
      categoricalCols,
      totalIssues,
      dataQuality: totalIssues === 0 ? 'excellent' : totalIssues < 5 ? 'bon' : 'à améliorer'
    };
  }, [data, columnAnalysis]);

  // Prévisualisation des données
  const previewData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(0, 10); // Premières 10 lignes
  }, [data]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric': return <Hash className="h-4 w-4 text-blue-500" />;
      case 'date': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'categorical': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getQualityBadge = (issues: string[]) => {
    if (issues.length === 0) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Parfait</Badge>;
    } else if (issues.length <= 2) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Bon</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />À améliorer</Badge>;
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Aperçu des données
          </CardTitle>
          <CardDescription>
            Aucune donnée à prévisualiser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Aperçu des données importées
        </CardTitle>
        <CardDescription>
          Vérifiez vos données avant de les importer
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistiques globales */}
        {globalStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{globalStats.totalRows}</div>
              <div className="text-sm text-muted-foreground">Lignes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{globalStats.totalColumns}</div>
              <div className="text-sm text-muted-foreground">Colonnes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{globalStats.numericCols}</div>
              <div className="text-sm text-muted-foreground">Numériques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{globalStats.dateCols}</div>
              <div className="text-sm text-muted-foreground">Dates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{globalStats.categoricalCols}</div>
              <div className="text-sm text-muted-foreground">Catégorielles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{globalStats.totalIssues}</div>
              <div className="text-sm text-muted-foreground">Problèmes</div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="flex space-x-2 mb-4">
          <Button
            variant={selectedTab === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('preview')}
          >
            Aperçu
          </Button>
          <Button
            variant={selectedTab === 'analysis' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('analysis')}
          >
            Analyse
          </Button>
          <Button
            variant={selectedTab === 'issues' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('issues')}
          >
            Problèmes
          </Button>
        </div>

        {/* Contenu des onglets */}
        {selectedTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Aperçu des données</h3>
              <Badge variant="secondary">
                {previewData.length} lignes affichées sur {data.length}
              </Badge>
            </div>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0] || {}).map(col => (
                      <TableHead key={col} className="font-medium">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, colIndex) => (
                        <TableCell key={colIndex} className="max-w-32 truncate">
                          {String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {selectedTab === 'analysis' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Analyse des colonnes</h3>
            <div className="grid gap-4">
              {columnAnalysis.map(col => (
                <Card key={col.name} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(col.type)}
                      <span className="font-medium">{col.name}</span>
                      <Badge variant="outline">{col.type}</Badge>
                    </div>
                    {getQualityBadge(col.issues)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valeurs uniques:</span>
                      <div className="font-medium">{col.uniqueCount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Manquantes:</span>
                      <div className="font-medium">{col.missingCount} ({col.missingPercentage.toFixed(1)}%)</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Exemples:</span>
                      <div className="font-medium text-xs">
                        {col.sampleValues.join(', ')}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'issues' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Problèmes détectés</h3>
            {columnAnalysis.some(col => col.issues.length > 0) ? (
              <div className="space-y-4">
                {columnAnalysis
                  .filter(col => col.issues.length > 0)
                  .map(col => (
                    <Card key={col.name} className="p-4 border-yellow-200 bg-yellow-50">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{col.name}</span>
                      </div>
                      <ul className="list-disc list-inside text-sm text-yellow-800">
                        {col.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-700">Aucun problème détecté !</p>
                <p className="text-muted-foreground">Vos données semblent être en bon état.</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>
            Confirmer l'import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportPreview; 