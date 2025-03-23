
import { FC, useState } from 'react';
import { Calculator, WandSparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  calculateNewValue, 
  CleaningMethod, 
  detectAnomalies, 
  generateDataQualityReport,
  interpolateTimeSeries
} from '@/utils/dataCleaningUtils';
import DataQualityCard from './DataQualityCard';
import CleaningMethodButtons from './CleaningMethodButtons';

interface DataCleaningDialogProps {
  data: Record<string, any>[];
  columns: string[];
  onDataChange: (newData: Record<string, any>[]) => void;
}

const DataCleaningDialog: FC<DataCleaningDialogProps> = ({ 
  data, 
  columns, 
  onDataChange 
}) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [outlierThreshold, setOutlierThreshold] = useState(1.5);
  const [smoothingWindow, setSmoothingWindow] = useState(3);
  const [timeColumn, setTimeColumn] = useState<string | null>(null);
  const [enableAdvancedCleaning, setEnableAdvancedCleaning] = useState(false);
  const [autoClean, setAutoClean] = useState(false);

  const prepareCleaningOperation = (
    column: string,
    method: CleaningMethod,
    rows: number[]
  ) => {
    if (!data) return null;

    const preview = rows.slice(0, 5);
    const changes = {
      totalRows: rows.length,
      previewRows: preview.map(idx => ({
        rowIndex: idx,
        oldValue: data[idx][column],
        newValue: calculateNewValue(data, column, method, idx)
      })),
      method,
      column
    };

    return changes;
  };

  const applyCleaningOperation = (
    column: string,
    method: CleaningMethod,
    rows: number[]
  ) => {
    if (!data || rows.length === 0) {
      toast({
        title: "Information",
        description: "Aucune valeur à nettoyer n'a été détectée."
      });
      return;
    }

    const changes = prepareCleaningOperation(column, method, rows);
    if (!changes) return;

    toast({
      title: "Confirmer le nettoyage des données",
      description: (
        <div className="space-y-4">
          <h4 className="font-medium">Aperçu des modifications :</h4>
          <div className="bg-muted p-2 rounded text-sm space-y-2">
            {changes.previewRows.map((row, i) => (
              <div key={i} className="flex justify-between">
                <span>Ligne {row.rowIndex + 1}:</span>
                <span>{row.oldValue} → {row.newValue}</span>
              </div>
            ))}
            {changes.totalRows > 5 && (
              <p className="text-muted-foreground">
                Et {changes.totalRows - 5} autres modifications...
              </p>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span>Méthode :</span>
            <span className="font-medium">{method}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total des modifications :</span>
            <span className="font-medium">{changes.totalRows} valeurs</span>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button
              variant="destructive"
              onClick={() => executeCleaningOperation(column, method, rows)}
            >
              Confirmer
            </Button>
            <Button
              variant="outline"
              onClick={() => toast({ title: "Opération annulée" })}
            >
              Annuler
            </Button>
          </div>
        </div>
      ),
    });
  };

  const executeCleaningOperation = (
    column: string,
    method: CleaningMethod,
    rows: number[]
  ) => {
    if (!data) return;

    let newData;
    if (method === 'delete') {
      newData = data.filter((_, idx) => !rows.includes(idx));
    } else {
      newData = [...data];
      rows.forEach(idx => {
        const newValue = calculateNewValue(data, column, method, idx);
        if (newValue !== null) {
          newData[idx] = { ...newData[idx], [column]: newValue };
        }
      });
    }

    onDataChange(newData);
    setShowDialog(false);
    toast({
      title: "Données nettoyées",
      description: `${rows.length} valeurs ont été ${method === 'delete' ? 'supprimées' : 'modifiées'}.`
    });
  };

  const handleCleaningOperation = (method: CleaningMethod, anomalies: number[]) => {
    if (!selectedColumn) return;
    applyCleaningOperation(selectedColumn, method, anomalies);
  };

  const runAdvancedCleaning = () => {
    if (!data || !selectedColumn) return;
    
    const newData = [...data];
    
    if (timeColumn) {
      // Pour les séries temporelles
      try {
        const interpolatedData = interpolateTimeSeries(data, selectedColumn, timeColumn);
        onDataChange(interpolatedData);
        toast({
          title: "Interpolation réussie",
          description: "Les données de la série temporelle ont été interpolées",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Échec de l'interpolation: " + (error instanceof Error ? error.message : "erreur inconnue"),
          variant: "destructive"
        });
      }
      return;
    }
    
    // Nettoyage avancé sans dimension temporelle (lissage)
    const values = data.map(row => parseFloat(row[selectedColumn])).filter(v => !isNaN(v));
    
    // Appliquer un filtre de lissage (moving average)
    const halfWindow = Math.floor(smoothingWindow / 2);
    let modifiedCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const val = parseFloat(data[i][selectedColumn]);
      if (isNaN(val)) continue;
      
      // Skip the edges where we don't have enough data points
      if (i < halfWindow || i >= data.length - halfWindow) continue;
      
      // Calculate moving average
      let sum = 0;
      for (let j = i - halfWindow; j <= i + halfWindow; j++) {
        const neighborVal = parseFloat(data[j][selectedColumn]);
        if (!isNaN(neighborVal)) {
          sum += neighborVal;
        }
      }
      
      const avg = sum / smoothingWindow;
      newData[i] = { ...newData[i], [selectedColumn]: avg.toFixed(2) };
      modifiedCount++;
    }
    
    onDataChange(newData);
    toast({
      title: "Données lissées",
      description: `${modifiedCount} valeurs ont été lissées avec une fenêtre de ${smoothingWindow}.`
    });
  };

  const runAutoClean = () => {
    if (!data || data.length === 0) return;
    
    const report = generateDataQualityReport(data, columns);
    let newData = [...data];
    let cleanedColumns = 0;
    
    for (const colReport of report) {
      if (colReport.recommendedAction) {
        const anomalies = detectAnomalies(data, colReport.column);
        
        if (anomalies.length > 0) {
          anomalies.forEach(idx => {
            const newValue = calculateNewValue(data, colReport.column, colReport.recommendedAction!, idx);
            if (newValue !== null && newValue !== 'DELETED') {
              newData[idx] = { ...newData[idx], [colReport.column]: newValue };
            }
          });
          cleanedColumns++;
        }
      }
    }
    
    // Seconde passe pour supprimer les lignes avec encore des valeurs manquantes
    if (autoClean) {
      const rowsToDelete = new Set<number>();
      
      for (let i = 0; i < newData.length; i++) {
        const row = newData[i];
        let hasMissingValues = false;
        
        for (const col of columns) {
          const val = row[col];
          if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
            hasMissingValues = true;
            break;
          }
        }
        
        if (hasMissingValues) {
          rowsToDelete.add(i);
        }
      }
      
      if (rowsToDelete.size > 0) {
        newData = newData.filter((_, idx) => !rowsToDelete.has(idx));
      }
    }
    
    onDataChange(newData);
    setShowDialog(false);
    
    toast({
      title: "Nettoyage automatique terminé",
      description: `${cleanedColumns} colonnes ont été nettoyées.${autoClean ? ` Les lignes problématiques restantes ont été supprimées.` : ''}`
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowDialog(true);
          const report = generateDataQualityReport(data, columns);
          if (report.length > 0) {
            setSelectedColumn(report[0].column);
          }
        }}
      >
        <Calculator className="w-4 h-4 mr-1" />
        Analyse et Nettoyage
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Analyse et Nettoyage des Données</AlertDialogTitle>
            <AlertDialogDescription>
              Rapport de qualité des données et options de nettoyage avancées
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Tabs defaultValue="basic">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basique</TabsTrigger>
              <TabsTrigger value="advanced">Avancé</TabsTrigger>
              <TabsTrigger value="auto">Auto</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6 py-4">
              <div className="space-y-4">
                <h4 className="font-semibold">État des données</h4>
                <div className="grid grid-cols-2 gap-4">
                  {generateDataQualityReport(data, columns).map(report => (
                    <DataQualityCard key={report.column} report={report} />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Sélectionner une colonne à nettoyer</h4>
                <Select
                  value={selectedColumn || undefined}
                  onValueChange={setSelectedColumn}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une colonne" />
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

              {selectedColumn && (
                <div className="space-y-4">
                  <h4 className="font-medium">Actions de nettoyage disponibles</h4>
                  <CleaningMethodButtons 
                    selectedColumn={selectedColumn}
                    data={data}
                    onCleanData={handleCleaningOperation}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-6 py-4">
              <div className="space-y-4">
                <h4 className="font-semibold">Nettoyage avancé</h4>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advanced-column">Colonne à traiter</Label>
                    <Select
                      value={selectedColumn || undefined}
                      onValueChange={setSelectedColumn}
                    >
                      <SelectTrigger id="advanced-column">
                        <SelectValue placeholder="Choisir une colonne" />
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
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="time-series-enable">Activer traitement série temporelle</Label>
                      <Switch 
                        id="time-series-enable" 
                        checked={enableAdvancedCleaning} 
                        onCheckedChange={setEnableAdvancedCleaning} 
                      />
                    </div>
                    
                    {enableAdvancedCleaning && (
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="time-column">Colonne temporelle (optionnel)</Label>
                          <Select
                            value={timeColumn || undefined}
                            onValueChange={setTimeColumn}
                          >
                            <SelectTrigger id="time-column">
                              <SelectValue placeholder="Sélectionner (optionnel)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Aucune</SelectItem>
                              {columns.filter(col => col !== selectedColumn).map(column => (
                                <SelectItem key={column} value={column}>
                                  {column}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Seuil pour la détection d'anomalies: {outlierThreshold}</Label>
                          <Slider
                            value={[outlierThreshold * 10]}
                            min={5}
                            max={30}
                            step={1}
                            onValueChange={(values) => setOutlierThreshold(values[0] / 10)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Un seuil plus bas (1.0) est plus sensible aux anomalies, tandis qu'un seuil plus élevé (3.0) est plus tolérant.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Fenêtre de lissage: {smoothingWindow}</Label>
                          <Slider
                            value={[smoothingWindow]}
                            min={3}
                            max={15}
                            step={2}
                            onValueChange={(values) => setSmoothingWindow(values[0])}
                          />
                          <p className="text-xs text-muted-foreground">
                            Une fenêtre plus grande produit un lissage plus important des fluctuations.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={runAdvancedCleaning}
                    disabled={!selectedColumn}
                    className="mt-2"
                  >
                    <WandSparkles className="w-4 h-4 mr-2" />
                    {timeColumn ? "Interpoler série temporelle" : "Appliquer lissage"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="auto" className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800">Nettoyage automatique</h4>
                    <p className="text-sm text-amber-700">
                      Le nettoyage automatique analysera toutes les colonnes et appliquera les méthodes de nettoyage recommandées.
                      Cette opération peut modifier de nombreuses valeurs à la fois.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-clean">Supprimer les lignes problématiques restantes</Label>
                  <Switch 
                    id="auto-clean" 
                    checked={autoClean} 
                    onCheckedChange={setAutoClean} 
                  />
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="default"
                    onClick={runAutoClean}
                    className="w-full"
                  >
                    <WandSparkles className="w-4 h-4 mr-2" />
                    Lancer le nettoyage automatique
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DataCleaningDialog;
