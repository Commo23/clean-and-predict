// src/utils/mlUtils.ts

/**
 * Utilitaires pour la validation, la reproductibilité et les calculs robustes des modèles ML/TimeSeries
 */

export interface DataValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  statistics: {
    totalRows: number;
    validRows: number;
    missingValues: number;
    outliers: number;
    minValue: number;
    maxValue: number;
    mean: number;
    std: number;
    isStationary: boolean;
  };
}

export interface ModelMetrics {
  rmse: number;
  mae: number;
  mape: number;
  r2: number;
  adjustedR2: number;
  aic: number;
  bic: number;
}

export interface TimeSeriesModel {
  id: string;
  name: string;
  description: string;
  requirements: {
    minDataPoints: number;
    maxDataPoints: number;
    requiresStationarity: boolean;
    handlesSeasonality: boolean;
    handlesTrend: boolean;
  };
  calculate: (data: number[], config: any) => {
    predictions: number[];
    metrics: ModelMetrics;
    parameters: any;
  };
}

// Fonction pour fixer la seed (reproductibilité)
export function setRandomSeed(seed: number) {
  // Math.random n'est pas seedable nativement, mais on peut utiliser une implémentation simple
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Validation des données temporelles
export function validateTimeSeriesData(
  timeValues: Date[],
  dataValues: number[]
): DataValidation {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (timeValues.length !== dataValues.length) {
    issues.push("Les tableaux de temps et de données ont des longueurs différentes");
    return {
      isValid: false,
      issues,
      warnings,
      statistics: {
        totalRows: 0,
        validRows: 0,
        missingValues: 0,
        outliers: 0,
        minValue: 0,
        maxValue: 0,
        mean: 0,
        std: 0,
        isStationary: false
      }
    };
  }

  const totalRows = timeValues.length;
  let validRows = 0;
  let missingValues = 0;
  let outliers = 0;
  const validData: number[] = [];

  for (let i = 0; i < totalRows; i++) {
    const time = timeValues[i];
    const value = dataValues[i];

    if (!time || isNaN(time.getTime())) {
      issues.push(`Date invalide à l'index ${i}`);
      continue;
    }

    if (value === null || value === undefined || isNaN(value)) {
      missingValues++;
      continue;
    }

    validRows++;
    validData.push(value);
  }

  if (validRows < 10) {
    issues.push("Insuffisamment de données valides (minimum 10 points requis)");
  }

  if (validRows < totalRows * 0.8) {
    warnings.push("Plus de 20% de données manquantes détectées");
  }

  // Statistiques
  const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
  const variance = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length;
  const std = Math.sqrt(variance);
  const minValue = Math.min(...validData);
  const maxValue = Math.max(...validData);

  // Outliers (IQR)
  const sortedData = [...validData].sort((a, b) => a - b);
  const q1 = sortedData[Math.floor(sortedData.length * 0.25)];
  const q3 = sortedData[Math.floor(sortedData.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  outliers = validData.filter(val => val < lowerBound || val > upperBound).length;

  if (outliers > validRows * 0.1) {
    warnings.push(`${outliers} outliers détectés (${(outliers/validRows*100).toFixed(1)}%)`);
  }

  // Stationnarité (variation de moyenne/variance)
  const isStationary = checkStationarity(validData);

  return {
    isValid: issues.length === 0 && validRows >= 10,
    issues,
    warnings,
    statistics: {
      totalRows,
      validRows,
      missingValues,
      outliers,
      minValue,
      maxValue,
      mean,
      std,
      isStationary
    }
  };
}

// Test de stationnarité simple
export function checkStationarity(data: number[]): boolean {
  if (data.length < 20) return true;
  const windowSize = Math.floor(data.length / 4);
  const means: number[] = [];
  const variances: number[] = [];
  for (let i = 0; i < data.length - windowSize; i += windowSize) {
    const window = data.slice(i, i + windowSize);
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
    means.push(mean);
    variances.push(variance);
  }
  const meanVariation = Math.max(...means) - Math.min(...means);
  const varianceVariation = Math.max(...variances) - Math.min(...variances);
  const meanOfMeans = means.reduce((sum, mean) => sum + mean, 0) / means.length;
  const meanOfVariances = variances.reduce((sum, varr) => sum + varr, 0) / variances.length;
  return meanVariation < 0.1 * meanOfMeans && varianceVariation < 0.1 * meanOfVariances;
}

// Calcul des métriques de performance
export function calculateMetrics(actual: number[], predicted: number[]): ModelMetrics {
  if (actual.length !== predicted.length || actual.length === 0) {
    throw new Error("Les tableaux actual et predicted doivent avoir la même longueur et être non vides");
  }
  const n = actual.length;
  const residuals = actual.map((a, i) => a - predicted[i]);
  const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / n);
  const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;
  const mape = actual.reduce((sum, a, i) => a !== 0 ? sum + Math.abs((a - predicted[i]) / a) : sum, 0) / n * 100;
  const meanActual = actual.reduce((sum, a) => sum + a, 0) / n;
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = actual.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0);
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
  const adjustedR2 = 1 - (1 - r2) * (n - 1) / (n - 2);
  const aic = n * Math.log(ssRes / n) + 2 * 2;
  const bic = n * Math.log(ssRes / n) + 2 * Math.log(n);
  return { rmse, mae, mape, r2, adjustedR2, aic, bic };
}

// Modèles de séries temporelles (exemple, à compléter selon besoins)
export const timeSeriesModels: TimeSeriesModel[] = [
  {
    id: 'arima',
    name: 'ARIMA/SARIMA',
    description: 'Modèle classique pour séries temporelles avec saisonnalité',
    requirements: {
      minDataPoints: 30,
      maxDataPoints: 10000,
      requiresStationarity: true,
      handlesSeasonality: true,
      handlesTrend: true
    },
    calculate: (data: number[], config: any) => {
      // ... (voir assistant pour version complète)
      return { predictions: [], metrics: {} as ModelMetrics, parameters: {} };
    }
  },
  // ... autres modèles à compléter
];

// Vérification de l'adéquation modèle/données
export function validateModelFit(
  model: TimeSeriesModel,
  data: number[],
  config: any
): { isValid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  if (data.length < model.requirements.minDataPoints) {
    issues.push(`${model.name} nécessite au moins ${model.requirements.minDataPoints} points de données (${data.length} fournis)`);
  }
  if (data.length > model.requirements.maxDataPoints) {
    warnings.push(`${model.name} est optimisé pour moins de ${model.requirements.maxDataPoints} points de données (${data.length} fournis)`);
  }
  if (model.requirements.requiresStationarity && !checkStationarity(data)) {
    issues.push(`${model.name} nécessite des données stationnaires`);
  }
  if (config.seasonality && !model.requirements.handlesSeasonality) {
    warnings.push(`${model.name} ne gère pas bien la saisonnalité`);
  }
  if (config.trend && !model.requirements.handlesTrend) {
    warnings.push(`${model.name} ne gère pas bien les tendances`);
  }
  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
} 