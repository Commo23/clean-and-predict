/**
 * Utilitaires pour la gestion des dates dans les séries temporelles
 */

export interface DateFormat {
  pattern: RegExp;
  format: string;
  description: string;
  parser: (dateString: string) => Date | null;
}

// Formats de date supportés
export const DATE_FORMATS: DateFormat[] = [
  {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    format: 'YYYY-MM-DD',
    description: 'ISO Date (YYYY-MM-DD)',
    parser: (dateString: string) => new Date(dateString)
  },
  {
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    format: 'ISO',
    description: 'ISO DateTime',
    parser: (dateString: string) => new Date(dateString)
  },
  {
    pattern: /^\d{2}\/\d{2}\/\d{4}$/,
    format: 'MM/DD/YYYY',
    description: 'US Date (MM/DD/YYYY)',
    parser: (dateString: string) => {
      const [month, day, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  },
  {
    pattern: /^\d{2}-\d{2}-\d{4}$/,
    format: 'MM-DD-YYYY',
    description: 'US Date with dashes (MM-DD-YYYY)',
    parser: (dateString: string) => {
      const [month, day, year] = dateString.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  },
  {
    pattern: /^\d{4}\/\d{2}\/\d{2}$/,
    format: 'YYYY/MM/DD',
    description: 'International Date (YYYY/MM/DD)',
    parser: (dateString: string) => {
      const [year, month, day] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  },
  {
    pattern: /^\d{2}\/\d{2}\/\d{2}$/,
    format: 'MM/DD/YY',
    description: 'Short Year (MM/DD/YY)',
    parser: (dateString: string) => {
      const [month, day, year] = dateString.split('/');
      const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      return new Date(fullYear, parseInt(month) - 1, parseInt(day));
    }
  },
  {
    pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    format: 'M/D/YYYY',
    description: 'Flexible US Date (M/D/YYYY)',
    parser: (dateString: string) => {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return null;
    }
  },
  {
    pattern: /^\d{1,2}-\d{1,2}-\d{4}$/,
    format: 'M-D-YYYY',
    description: 'Flexible US Date with dashes (M-D-YYYY)',
    parser: (dateString: string) => {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return null;
    }
  },
  {
    pattern: /^\d{2}\.\d{2}\.\d{4}$/,
    format: 'DD.MM.YYYY',
    description: 'European Date (DD.MM.YYYY)',
    parser: (dateString: string) => {
      const [day, month, year] = dateString.split('.');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  },
  {
    pattern: /^\d{2}\/\d{2}\/\d{4}$/,
    format: 'DD/MM/YYYY',
    description: 'European Date with slashes (DD/MM/YYYY)',
    parser: (dateString: string) => {
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
];

/**
 * Détecte automatiquement le format de date à partir d'un échantillon de données
 */
export function detectDateFormat(dateStrings: string[]): DateFormat | null {
  if (!dateStrings || dateStrings.length === 0) return null;

  // Filtrer les valeurs vides
  const validDates = dateStrings.filter(date => date && typeof date === 'string' && date.trim() !== '');
  
  if (validDates.length === 0) return null;

  // Tester chaque format
  for (const format of DATE_FORMATS) {
    const matches = validDates.filter(date => format.pattern.test(date));
    const matchRate = matches.length / validDates.length;
    
    // Si plus de 80% des dates correspondent au format
    if (matchRate >= 0.8) {
      // Vérifier que les dates parsées sont valides
      const validParsed = matches.filter(date => {
        const parsed = format.parser(date);
        return parsed && !isNaN(parsed.getTime());
      });
      
      if (validParsed.length / matches.length >= 0.9) {
        return format;
      }
    }
  }

  return null;
}

/**
 * Parse une date selon un format spécifique
 */
export function parseDate(dateString: string, format: DateFormat | string): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;

  try {
    // Si format est une chaîne, trouver le format correspondant
    if (typeof format === 'string') {
      const dateFormat = DATE_FORMATS.find(f => f.format === format);
      if (!dateFormat) {
        // Essayer le parsing automatique
        return new Date(dateString);
      }
      return dateFormat.parser(dateString);
    }

    // Si format est un objet DateFormat
    return format.parser(dateString);
  } catch (error) {
    console.error('Erreur de parsing de date:', error);
    return null;
  }
}

/**
 * Valide si une chaîne correspond à un format de date
 */
export function isValidDateFormat(dateString: string, format: DateFormat): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  if (!format.pattern.test(dateString)) return false;
  
  const parsed = format.parser(dateString);
  return parsed !== null && !isNaN(parsed.getTime());
}

/**
 * Formate une date selon un format spécifique
 */
export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * Calcule la fréquence d'une série temporelle
 */
export function detectTimeSeriesFrequency(dates: Date[]): 'daily' | 'weekly' | 'monthly' | 'yearly' | 'irregular' {
  if (dates.length < 2) return 'irregular';

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    intervals.push(daysDiff);
  }

  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const stdDev = Math.sqrt(
    intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
  );

  // Tolérance pour les variations (20% de l'intervalle moyen)
  const tolerance = avgInterval * 0.2;

  if (Math.abs(avgInterval - 1) <= tolerance && stdDev <= tolerance) {
    return 'daily';
  } else if (Math.abs(avgInterval - 7) <= tolerance && stdDev <= tolerance) {
    return 'weekly';
  } else if (Math.abs(avgInterval - 30) <= tolerance && stdDev <= tolerance) {
    return 'monthly';
  } else if (Math.abs(avgInterval - 365) <= tolerance && stdDev <= tolerance) {
    return 'yearly';
  } else {
    return 'irregular';
  }
}

/**
 * Génère des dates futures selon une fréquence donnée
 */
export function generateFutureDates(
  lastDate: Date, 
  count: number, 
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(lastDate);

  for (let i = 1; i <= count; i++) {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + i);
        break;
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + (i * 7));
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + i);
        break;
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + i);
        break;
    }
    
    dates.push(nextDate);
  }

  return dates;
}

/**
 * Vérifie si une série temporelle est stationnaire
 */
export function checkStationarity(values: number[]): {
  isStationary: boolean;
  meanVariation: number;
  varianceVariation: number;
  details: {
    means: number[];
    variances: number[];
  };
} {
  if (values.length < 10) {
    return {
      isStationary: false,
      meanVariation: 0,
      varianceVariation: 0,
      details: { means: [], variances: [] }
    };
  }

  const windowSize = Math.floor(values.length / 4);
  const means: number[] = [];
  const variances: number[] = [];

  for (let i = 0; i < values.length - windowSize; i += windowSize) {
    const window = values.slice(i, i + windowSize);
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
    
    means.push(mean);
    variances.push(variance);
  }

  const meanVariation = Math.max(...means) - Math.min(...means);
  const varianceVariation = Math.max(...variances) - Math.min(...variances);
  const meanOfMeans = means.reduce((sum, mean) => sum + mean, 0) / means.length;
  const meanOfVariances = variances.reduce((sum, var) => sum + var, 0) / variances.length;

  const isStationary = meanVariation < 0.1 * meanOfMeans && varianceVariation < 0.1 * meanOfVariances;

  return {
    isStationary,
    meanVariation,
    varianceVariation,
    details: { means, variances }
  };
} 