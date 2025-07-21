import { DataRow } from '@/types';

/**
 * Convertit une valeur en string de manière sûre
 */
export const safeToString = (value: string | number | boolean | null): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Convertit une valeur en number de manière sûre
 */
export const safeToNumber = (value: string | number | boolean | null): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Vérifie si une valeur est numérique
 */
export const isNumeric = (value: string | number | boolean | null): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'boolean') return false;
  return !isNaN(parseFloat(value));
};

/**
 * Extrait les valeurs numériques d'une colonne
 */
export const getNumericValues = (data: DataRow[], column: string): number[] => {
  return data
    .map(row => safeToNumber(row[column]))
    .filter(value => value !== 0 || isNumeric(data.find(row => row[column] === 0)?.[column] || null));
};

/**
 * Extrait les valeurs string d'une colonne
 */
export const getStringValues = (data: DataRow[], column: string): string[] => {
  return data
    .map(row => safeToString(row[column]))
    .filter(value => value !== '');
};

/**
 * Vérifie si une colonne contient principalement des valeurs numériques
 */
export const isNumericColumn = (data: DataRow[], column: string): boolean => {
  if (!data || data.length === 0) return false;
  
  const numericCount = data.filter(row => isNumeric(row[column])).length;
  return numericCount / data.length > 0.5; // Plus de 50% de valeurs numériques
};

/**
 * Vérifie si une colonne contient des dates
 */
export const isDateColumn = (data: DataRow[], column: string): boolean => {
  if (!data || data.length === 0) return false;
  
  const sample = data.slice(0, Math.min(10, data.length));
  const datePatterns = [
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/, // jj/mm/aaaa, jj-mm-aaaa, jj.mm.aaaa
    /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/, // aaaa/mm/jj, aaaa-mm-jj, aaaa.mm.jj
    /^\d{4}-\d{2}-\d{2}$/, // ISO format
    /^\d{2}\/\d{2}\/\d{4}$/ // US format
  ];
  
  let dateCount = 0;
  for (const row of sample) {
    const value = safeToString(row[column]);
    if (value && (datePatterns.some(pattern => pattern.test(value)) || !isNaN(new Date(value).getTime()))) {
      dateCount++;
    }
  }
  
  return dateCount / sample.length > 0.7; // Plus de 70% de valeurs ressemblant à des dates
};

/**
 * Normalise une valeur pour l'affichage
 */
export const normalizeValue = (value: string | number | boolean | null): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value);
}; 