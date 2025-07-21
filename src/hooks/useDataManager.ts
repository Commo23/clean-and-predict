import { useState, useCallback, useMemo } from 'react';
import { DataSet, DataRow, DataQualityStats, ColumnQualityReport } from '@/types';
import { calculateColumnStats, generateDataQualityReport } from '@/utils/dataCleaningUtils';
import { isNumericColumn, isDateColumn } from '@/utils/typeUtils';

interface UseDataManagerReturn {
  dataSet: DataSet | null;
  setDataSet: (dataSet: DataSet | null) => void;
  columns: string[];
  numericColumns: string[];
  dateColumns: string[];
  dataQuality: ColumnQualityReport[];
  getColumnStats: (column: string) => DataQualityStats | null;
  updateData: (newData: DataRow[]) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  updateRow: (index: number, row: DataRow) => void;
  clearData: () => void;
}

export const useDataManager = (): UseDataManagerReturn => {
  const [dataSet, setDataSet] = useState<DataSet | null>(null);

  const columns = useMemo(() => {
    return dataSet?.columns || [];
  }, [dataSet]);

  const numericColumns = useMemo(() => {
    if (!dataSet?.data) return [];
    return columns.filter(column => isNumericColumn(dataSet.data, column));
  }, [dataSet, columns]);

  const dateColumns = useMemo(() => {
    if (!dataSet?.data) return [];
    return columns.filter(column => isDateColumn(dataSet.data, column));
  }, [dataSet, columns]);

  const dataQuality = useMemo(() => {
    if (!dataSet?.data) return [];
    return generateDataQualityReport(dataSet.data, columns);
  }, [dataSet, columns]);

  const getColumnStats = useCallback((column: string): DataQualityStats | null => {
    if (!dataSet?.data) return null;
    return calculateColumnStats(dataSet.data, column);
  }, [dataSet]);

  const updateData = useCallback((newData: DataRow[]) => {
    if (!dataSet) return;
    
    setDataSet({
      ...dataSet,
      data: newData,
      metadata: {
        ...dataSet.metadata,
        rowCount: newData.length
      }
    });
  }, [dataSet]);

  const addRow = useCallback(() => {
    if (!dataSet) return;
    
    const newRow: DataRow = {};
    columns.forEach(column => {
      newRow[column] = '';
    });
    
    const newData = [...dataSet.data, newRow];
    updateData(newData);
  }, [dataSet, columns, updateData]);

  const removeRow = useCallback((index: number) => {
    if (!dataSet) return;
    
    const newData = dataSet.data.filter((_, i) => i !== index);
    updateData(newData);
  }, [dataSet, updateData]);

  const updateRow = useCallback((index: number, row: DataRow) => {
    if (!dataSet) return;
    
    const newData = [...dataSet.data];
    newData[index] = row;
    updateData(newData);
  }, [dataSet, updateData]);

  const clearData = useCallback(() => {
    setDataSet(null);
  }, []);

  return {
    dataSet,
    setDataSet,
    columns,
    numericColumns,
    dateColumns,
    dataQuality,
    getColumnStats,
    updateData,
    addRow,
    removeRow,
    updateRow,
    clearData
  };
}; 