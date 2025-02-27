
import { FC } from 'react';
import { Button } from "@/components/ui/button";
import { detectAnomalies, CleaningMethod } from '@/utils/dataCleaningUtils';

interface CleaningMethodButtonsProps {
  selectedColumn: string;
  data: Record<string, any>[];
  onCleanData: (method: CleaningMethod, anomalies: number[]) => void;
}

const CleaningMethodButtons: FC<CleaningMethodButtonsProps> = ({ 
  selectedColumn, 
  data, 
  onCleanData 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="justify-start h-auto py-4"
        onClick={() => {
          const anomalies = detectAnomalies(data, selectedColumn);
          onCleanData('mean', anomalies);
        }}
      >
        <div className="text-left">
          <div className="font-medium">Remplacer par la moyenne</div>
          <div className="text-sm text-muted-foreground">
            Idéal pour les valeurs manquantes isolées
          </div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="justify-start h-auto py-4"
        onClick={() => {
          const anomalies = detectAnomalies(data, selectedColumn);
          onCleanData('median', anomalies);
        }}
      >
        <div className="text-left">
          <div className="font-medium">Remplacer par la médiane</div>
          <div className="text-sm text-muted-foreground">
            Meilleur pour les données avec beaucoup d'anomalies
          </div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="justify-start h-auto py-4"
        onClick={() => {
          const anomalies = detectAnomalies(data, selectedColumn);
          onCleanData('previous', anomalies);
        }}
      >
        <div className="text-left">
          <div className="font-medium">Utiliser valeur précédente/suivante</div>
          <div className="text-sm text-muted-foreground">
            Pour les données séquentielles ou temporelles
          </div>
        </div>
      </Button>
      <Button
        variant="destructive"
        className="justify-start h-auto py-4"
        onClick={() => {
          const anomalies = detectAnomalies(data, selectedColumn);
          onCleanData('delete', anomalies);
        }}
      >
        <div className="text-left">
          <div className="font-medium">Supprimer les lignes</div>
          <div className="text-sm">
            En dernier recours, pour les données très problématiques
          </div>
        </div>
      </Button>
    </div>
  );
};

export default CleaningMethodButtons;
