
import { FC } from 'react';
import { ColumnQualityReport } from '@/utils/dataCleaningUtils';
import { cn } from "@/lib/utils";

interface DataQualityCardProps {
  report: ColumnQualityReport;
}

const DataQualityCard: FC<DataQualityCardProps> = ({ report }) => {
  return (
    <div 
      className={cn(
        "p-4 bg-muted rounded-lg relative",
        (report.stats.missingPercentage + report.stats.outliersPercentage > 30) 
          ? "border-2 border-destructive" 
          : ""
      )}
    >
      <h5 className="font-medium mb-3 flex items-center justify-between">
        {report.column}
        {report.recommendedAction && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            Action recommandée: {report.recommendedAction}
          </span>
        )}
      </h5>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Valeurs manquantes:</span>
          <span className={cn(
            report.stats.missingPercentage > 20 ? "text-destructive" : ""
          )}>
            {report.stats.missingPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Valeurs aberrantes:</span>
          <span className={cn(
            report.stats.outliersPercentage > 20 ? "text-destructive" : ""
          )}>
            {report.stats.outliersPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
          <div>Min: {report.stats.min.toFixed(2)}</div>
          <div>Max: {report.stats.max.toFixed(2)}</div>
          <div>Moyenne: {report.stats.mean.toFixed(2)}</div>
          <div>Médiane: {report.stats.median.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityCard;
