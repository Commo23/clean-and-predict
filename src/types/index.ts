// Types pour les données
export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface DataSet {
  data: DataRow[];
  columns: string[];
  metadata?: {
    fileName?: string;
    fileSize?: number;
    uploadDate?: Date;
    rowCount: number;
    columnCount: number;
  };
}

// Types pour les graphiques
export interface ChartConfig {
  id: number;
  chartType: 'line' | 'area' | 'bar' | 'scatter' | 'composed' | 'pie' | 'radar' | 'radialBar' | 'treemap';
  xAxis: string;
  selectedColumns: string[];
  isTimeSeries: boolean;
  title: string;
  gridArea: string;
  showLegend: boolean;
  stacked: boolean;
  normalized: boolean;
  gridLines: boolean;
  colorScheme: string;
  showBrush: boolean;
  dateFormat: string;
}

// Types pour le Machine Learning
export interface MLModel {
  id: string;
  name: string;
  description: string;
  type: 'regression' | 'classification' | 'timeSeries';
}

export interface MLPrediction {
  date: string;
  predicted: number;
  lowerBound?: number;
  upperBound?: number;
  confidence?: number;
}

export interface MLStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  rmse?: number;
  mae?: number;
  r2?: number;
}

export interface CrossValidationResult {
  fold: number;
  rmse: number;
  mae?: number;
  r2?: number;
}

export interface StationarityTest {
  isStationary: boolean;
  meanVariation: number;
  varianceVariation: number;
  means: number[];
  variances: number[];
}

// Types pour le nettoyage de données
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

// Types pour les options d'importation
export interface ImportOptions {
  useEuropeanFormat: boolean;
  delimiter: string;
  encoding: string;
  skipEmptyRows: boolean;
  trimWhitespace: boolean;
  autoDetectHeaders: boolean;
  dateFormat: string;
  numberFormat: string;
  maxRows?: number;
  selectedColumns?: string[];
  customHeaders?: string[];
}

// Types pour les filtres et tri
export interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface FilterConfig {
  [key: string]: string;
}

// Types pour les paramètres de visualisation
export interface VisualizationSettings {
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  animatedCharts: boolean;
  smoothCurves: boolean;
  chartOpacity: number;
  colorPalette: string;
}

// Types pour les erreurs
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
} 