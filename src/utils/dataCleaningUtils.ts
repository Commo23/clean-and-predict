
export type CleaningMethod = 'mean' | 'median' | 'previous' | 'delete';

export interface DataQualityStats {
  missing: number;
  outliers: number;
  total: number;
  missingPercentage: number;
  outliersPercentage: number;
  summary: {
    mean: number;
    median: number;
    std: number;
    q1: number;
    q3: number;
  };
}

export interface ColumnQualityReport {
  column: string;
  stats: {
    total: number;
    missing: number;
    missingPercentage: number;
    outliers: number;
    outliersPercentage: number;
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  };
  recommendedAction?: CleaningMethod;
}

export const calculateColumnStats = (data: Record<string, any>[], column: string): DataQualityStats | null => {
  if (!data || data.length === 0) return null;
  
  const values = data.map(row => {
    const value = parseFloat(row[column]);
    return { value, isMissing: isNaN(value) };
  });

  const numericValues = values.filter(v => !v.isMissing).map(v => v.value);
  const missing = values.filter(v => v.isMissing).length;

  if (numericValues.length === 0) return null;

  const sorted = [...numericValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers = numericValues.filter(v => v < lowerBound || v > upperBound).length;
  const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const std = Math.sqrt(
    numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length
  );

  return {
    missing,
    outliers,
    total: data.length,
    missingPercentage: (missing / data.length) * 100,
    outliersPercentage: (outliers / data.length) * 100,
    summary: {
      mean,
      median,
      std,
      q1,
      q3
    }
  };
};

export const analyzeColumn = (data: Record<string, any>[], column: string): ColumnQualityReport | null => {
  if (!data || data.length === 0) return null;

  const values = data.map(row => ({
    value: Number(row[column]),
    isValid: !isNaN(Number(row[column])) && row[column] !== null && row[column] !== undefined
  }));

  const validValues = values.filter(v => v.isValid).map(v => v.value);
  if (validValues.length === 0) return null;

  const sorted = [...validValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const missing = values.filter(v => !v.isValid).length;
  const outliers = validValues.filter(v => v < lowerBound || v > upperBound).length;
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const std = Math.sqrt(
    validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validValues.length
  );

  // Détermination automatique de la méthode recommandée
  let recommendedAction: CleaningMethod | undefined;
  const missingPercentage = (missing / data.length) * 100;
  const outliersPercentage = (outliers / data.length) * 100;

  if (missingPercentage > 50) {
    recommendedAction = 'delete'; 
  } else if (outliersPercentage > 30) {
    recommendedAction = 'median'; 
  } else if (missingPercentage > 0) {
    recommendedAction = 'mean'; 
  }

  return {
    column,
    stats: {
      total: data.length,
      missing,
      missingPercentage,
      outliers,
      outliersPercentage,
      mean,
      median,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    },
    recommendedAction
  };
};

export const detectAnomalies = (data: Record<string, any>[], column: string): number[] => {
  if (!data || data.length === 0) return [];
  
  const values = data
    .map((row, index) => ({ 
      value: Number(row[column]), 
      index,
      original: row[column]
    }))
    .filter(item => !isNaN(item.value));

  if (values.length === 0) return [];

  const sortedValues = [...values].sort((a, b) => a.value - b.value);
  const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)].value;
  const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)].value;
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Fixed: Ensure we return a number[] rather than a Record
  const anomalyIndices: number[] = [];
  
  for (let idx = 0; idx < data.length; idx++) {
    const val = Number(data[idx][column]);
    if (isNaN(val) || val === null || val === undefined || val < lowerBound || val > upperBound) {
      anomalyIndices.push(idx);
    }
  }
  
  return anomalyIndices;
};

export const calculateNewValue = (data: Record<string, any>[], column: string, method: CleaningMethod, rowIndex: number): string | null => {
  if (!data) return null;

  const report = analyzeColumn(data, column);
  if (!report) return null;

  switch (method) {
    case 'mean':
      return report.stats.mean.toFixed(2);
    case 'median':
      return report.stats.median.toFixed(2);
    case 'previous': {
      let prevIdx = rowIndex - 1;
      while (prevIdx >= 0) {
        const prevValue = Number(data[prevIdx][column]);
        if (!isNaN(prevValue)) return prevValue.toFixed(2);
        prevIdx--;
      }
      let nextIdx = rowIndex + 1;
      while (nextIdx < data.length) {
        const nextValue = Number(data[nextIdx][column]);
        if (!isNaN(nextValue)) return nextValue.toFixed(2);
        nextIdx++;
      }
      return report.stats.mean.toFixed(2);
    }
    case 'delete':
      return 'DELETED';
    default:
      return null;
  }
};

export const generateDataQualityReport = (data: Record<string, any>[], columns: string[]): ColumnQualityReport[] => {
  if (!data || columns.length === 0) return [];
  return columns
    .map(column => analyzeColumn(data, column))
    .filter((report): report is ColumnQualityReport => report !== null)
    .sort((a, b) => 
      (b.stats.missingPercentage + b.stats.outliersPercentage) - 
      (a.stats.missingPercentage + a.stats.outliersPercentage)
    );
};

// Nouvelles fonctions pour le traitement avancé des séries temporelles
export const interpolateTimeSeries = (data: Record<string, any>[], valueColumn: string, timeColumn: string): Record<string, any>[] => {
  if (!data || data.length === 0) return data;
  
  // Vérifier que les données sont triées par timeColumn
  const sortedData = [...data].sort((a, b) => {
    const timeA = new Date(a[timeColumn]).getTime();
    const timeB = new Date(b[timeColumn]).getTime();
    return timeA - timeB;
  });
  
  const result = [...sortedData];
  
  // Trouver les valeurs manquantes ou anomalies
  for (let i = 0; i < result.length; i++) {
    const value = Number(result[i][valueColumn]);
    if (isNaN(value)) {
      // Interpolation linéaire
      let prevIndex = -1;
      let nextIndex = -1;
      
      // Trouver la valeur précédente valide
      for (let j = i - 1; j >= 0; j--) {
        if (!isNaN(Number(result[j][valueColumn]))) {
          prevIndex = j;
          break;
        }
      }
      
      // Trouver la valeur suivante valide
      for (let j = i + 1; j < result.length; j++) {
        if (!isNaN(Number(result[j][valueColumn]))) {
          nextIndex = j;
          break;
        }
      }
      
      // Si nous avons trouvé des valeurs valides avant et après
      if (prevIndex !== -1 && nextIndex !== -1) {
        const prevValue = Number(result[prevIndex][valueColumn]);
        const nextValue = Number(result[nextIndex][valueColumn]);
        
        // Interpolation linéaire basée sur le temps si possible
        try {
          const prevTime = new Date(result[prevIndex][timeColumn]).getTime();
          const nextTime = new Date(result[nextIndex][timeColumn]).getTime();
          const currentTime = new Date(result[i][timeColumn]).getTime();
          
          if (!isNaN(prevTime) && !isNaN(nextTime) && !isNaN(currentTime)) {
            const ratio = (currentTime - prevTime) / (nextTime - prevTime);
            const interpolatedValue = prevValue + (nextValue - prevValue) * ratio;
            result[i] = { 
              ...result[i], 
              [valueColumn]: interpolatedValue.toFixed(2),
              __interpolated: true // Marquer la valeur comme interpolée
            };
          } else {
            // Fallback si les dates ne sont pas valides: moyenne simple
            result[i] = { 
              ...result[i], 
              [valueColumn]: ((prevValue + nextValue) / 2).toFixed(2),
              __interpolated: true
            };
          }
        } catch (e) {
          // Fallback si le format de date pose problème
          result[i] = { 
            ...result[i], 
            [valueColumn]: ((prevValue + nextValue) / 2).toFixed(2),
            __interpolated: true
          };
        }
      } else if (prevIndex !== -1) {
        // Si on a seulement une valeur précédente
        result[i] = { 
          ...result[i], 
          [valueColumn]: result[prevIndex][valueColumn],
          __interpolated: true
        };
      } else if (nextIndex !== -1) {
        // Si on a seulement une valeur suivante
        result[i] = { 
          ...result[i], 
          [valueColumn]: result[nextIndex][valueColumn],
          __interpolated: true
        };
      }
      // Si aucune valeur valide n'est trouvée, on laisse la valeur inchangée
    }
  }
  
  return result;
};

// Fonction pour lisser une série temporelle avec la méthode de la moyenne mobile
export const smoothTimeSeries = (data: Record<string, any>[], valueColumn: string, windowSize: number = 3): Record<string, any>[] => {
  if (!data || data.length === 0 || windowSize < 2) return data;
  
  const result = [...data];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < data.length; i++) {
    // Skip edges where we don't have enough points
    if (i < halfWindow || i >= data.length - halfWindow) continue;
    
    let sum = 0;
    let count = 0;
    
    for (let j = i - halfWindow; j <= i + halfWindow; j++) {
      const val = Number(data[j][valueColumn]);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    }
    
    if (count > 0) {
      result[i] = {
        ...result[i],
        [valueColumn]: (sum / count).toFixed(2),
        __smoothed: true
      };
    }
  }
  
  return result;
};
