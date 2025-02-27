
import { FC, useState } from 'react';
import { Calculator } from "lucide-react";
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
import { 
  calculateNewValue, 
  CleaningMethod, 
  detectAnomalies, 
  generateDataQualityReport 
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
              Rapport de qualité des données et recommandations de nettoyage
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="font-semibold">État global des données</h4>
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
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DataCleaningDialog;
