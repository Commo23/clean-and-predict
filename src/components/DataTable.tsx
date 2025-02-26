import React, { useState, useMemo } from 'react';
import {
  Table, TableHeader, TableBody, TableHead,
  TableRow, TableCell
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Pencil, Save, Trash, Plus, ArrowUpDown, Search, Filter, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type CleaningMethod = 'mean' | 'median' | 'previous' | 'delete';

interface ColumnQualityReport {
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

interface DataQualityStats {
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

const DataTable = ({ data, onDataChange }: DataTableProps) => {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ column: null, direction: null });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [showCleaningDialog, setShowCleaningDialog] = useState(false);
  const [dataQualityStats, setDataQualityStats] = useState<Record<string, DataQualityStats>>({});

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const getUniqueValues = (column: string) => {
    if (!data) return [];
    return [...new Set(data.map(row => row[column]))];
  };

  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.column === column) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    
    setSortConfig({ column: direction ? column : null, direction });
  };

  const calculateColumnStats = (column: string) => {
    if (!data) return null;
    
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

  const showDataQuality = (column: string) => {
    const stats = calculateColumnStats(column);
    if (!stats) {
      toast({
        title: "Information non disponible",
        description: "Cette colonne ne contient pas de données numériques valides.",
        variant: "destructive"
      });
      return;
    }

    setDataQualityStats({ [column]: stats });
    setSelectedColumn(column);

    toast({
      title: "Statistiques de qualité des données",
      description: (
        <div className="space-y-2">
          <p>Valeurs manquantes: {stats.missing} ({stats.missingPercentage.toFixed(1)}%)</p>
          <p>Valeurs aberrantes: {stats.outliers} ({stats.outliersPercentage.toFixed(1)}%)</p>
          <p className="font-semibold mt-2">Statistiques:</p>
          <p>Moyenne: {stats.summary.mean.toFixed(2)}</p>
          <p>Médiane: {stats.summary.median.toFixed(2)}</p>
          <p>Écart-type: {stats.summary.std.toFixed(2)}</p>
          <p>Q1: {stats.summary.q1.toFixed(2)}</p>
          <p>Q3: {stats.summary.q3.toFixed(2)}</p>
        </div>
      ),
    });
  };

  const getColumnStatistics = () => {
    if (!data || columns.length === 0) return null;
    
    return columns.reduce((stats: Record<string, DataQualityStats>, column) => {
      const columnStats = calculateColumnStats(column);
      if (columnStats) {
        stats[column] = columnStats;
      }
      return stats;
    }, {});
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];
    
    let processed = [...data];

    Object.entries(filters).forEach(([column, value]) => {
      if (activeFilters[column] && value) {
        processed = processed.filter(row => 
          String(row[column]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    if (searchTerm) {
      processed = processed.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig.column && sortConfig.direction) {
      processed.sort((a, b) => {
        const aVal = a[sortConfig.column!];
        const bVal = b[sortConfig.column!];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return sortConfig.direction === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return processed;
  }, [data, filters, activeFilters, searchTerm, sortConfig]);

  const handleEdit = (row: number, col: string, value: string) => {
    setEditingCell({ row, col });
    setEditValue(value);
  };

  const handleSave = () => {
    if (!editingCell || !data) return;
    
    const newData = [...data];
    newData[editingCell.row] = {
      ...newData[editingCell.row],
      [editingCell.col]: editValue
    };
    
    onDataChange(newData);
    setEditingCell(null);
    
    toast({
      title: "Changes saved",
      description: "Your data has been updated successfully."
    });
  };

  const handleDeleteRows = () => {
    if (!data) return;
    const newData = data.filter((_, index) => !selectedRows.includes(index));
    onDataChange(newData);
    setSelectedRows([]);
    
    toast({
      title: "Rows deleted",
      description: `${selectedRows.length} row(s) have been deleted.`
    });
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const addNewRow = () => {
    if (!data || data.length === 0) return;
    
    const newRow = Object.fromEntries(
      columns.map(col => [col, ''])
    );
    
    onDataChange([...data, newRow]);
    
    toast({
      title: "Row added",
      description: "A new row has been added to the table."
    });
  };

  const detectAnomalies = (column: string) => {
    if (!data) return [];
    
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

    return data.reduce((acc: number[], row, idx) => {
      const val = Number(row[column]);
      if (isNaN(val) || val === null || val === undefined || val < lowerBound || val > upperBound) {
        acc.push(idx);
      }
      return acc;
    }, []);
  };

  const analyzeColumn = (column: string): ColumnQualityReport | null => {
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

    let recommendedAction: CleaningMethod | undefined;
    const missingPercentage = (missing / data.length) * 100;
    const outliersPercentage = (outliers / data.length) * 100;

    if (missingPercentage > 50) {
      recommendedAction = 'delete'; // Trop de valeurs manquantes
    } else if (outliersPercentage > 30) {
      recommendedAction = 'median'; // Beaucoup de valeurs aberrantes
    } else if (missingPercentage > 0) {
      recommendedAction = 'mean'; // Quelques valeurs manquantes
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

  const generateDataQualityReport = () => {
    if (!data || columns.length === 0) return [];
    return columns
      .map(analyzeColumn)
      .filter((report): report is ColumnQualityReport => report !== null)
      .sort((a, b) => 
        (b.stats.missingPercentage + b.stats.outliersPercentage) - 
        (a.stats.missingPercentage + a.stats.outliersPercentage)
      );
  };

  const prepareCleaningOperation = (
    column: string,
    method: CleaningMethod,
    rows: number[]
  ) => {
    if (!data) return null;

    const preview = rows.slice(0, 5);
    const report = analyzeColumn(column);
    if (!report) return null;

    const changes = {
      totalRows: rows.length,
      previewRows: preview.map(idx => ({
        rowIndex: idx,
        oldValue: data[idx][column],
        newValue: calculateNewValue(column, method, idx)
      })),
      method,
      column,
      stats: report.stats
    };

    return changes;
  };

  const calculateNewValue = (column: string, method: CleaningMethod, rowIndex: number) => {
    if (!data) return null;

    const report = analyzeColumn(column);
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

  const applyCleaningOperation = (
    column: string,
    method: CleaningMethod,
    rows: number[]
  ) => {
    if (!data) return;

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
        const newValue = calculateNewValue(column, method, idx);
        if (newValue !== null) {
          newData[idx] = { ...newData[idx], [column]: newValue };
        }
      });
    }

    onDataChange(newData);
    setShowCleaningDialog(false);
    toast({
      title: "Données nettoyées",
      description: `${rows.length} valeurs ont été ${method === 'delete' ? 'supprimées' : 'modifiées'}.`
    });
  };

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCleaningDialog(true);
              const report = generateDataQualityReport();
              if (report.length > 0) {
                setSelectedColumn(report[0].column);
              }
            }}
          >
            <Calculator className="w-4 h-4 mr-1" />
            Analyse et Nettoyage
          </Button>
          <Button size="sm" onClick={addNewRow}>
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowCleaningDialog(true);
              if (selectedColumn) {
                showDataQuality(selectedColumn);
              }
            }}
          >
            <Calculator className="w-4 h-4 mr-1" />
            Analyser et Nettoyer les Données
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="text-sm text-gray-500">
            {selectedRows.length} row(s) selected
          </div>
        </div>
      </div>

      <AlertDialog open={showCleaningDialog} onOpenChange={setShowCleaningDialog}>
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
                {generateDataQualityReport().map(report => (
                  <div 
                    key={report.column} 
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
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4"
                    onClick={() => {
                      const anomalies = detectAnomalies(selectedColumn);
                      applyCleaningOperation(selectedColumn, 'mean', anomalies);
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
                      const anomalies = detectAnomalies(selectedColumn);
                      applyCleaningOperation(selectedColumn, 'median', anomalies);
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
                      const anomalies = detectAnomalies(selectedColumn);
                      applyCleaningOperation(selectedColumn, 'previous', anomalies);
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
                      const anomalies = detectAnomalies(selectedColumn);
                      applyCleaningOperation(selectedColumn, 'delete', anomalies);
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
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrollArea className="h-[500px] rounded-md border">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredAndSortedData.length}
                    onChange={(e) => {
                      setSelectedRows(
                        e.target.checked ? Array.from(Array(filteredAndSortedData.length).keys()) : []
                      );
                    }}
                  />
                </TableHead>
                {columns.map(column => (
                  <TableHead key={column}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSort(column)}
                          className="flex items-center space-x-1 hover:text-primary"
                        >
                          {column}
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <div className="p-2">
                            <Input
                              placeholder={`Filter ${column}...`}
                              value={filters[column] || ''}
                              onChange={(e) => {
                                setFilters(prev => ({
                                  ...prev,
                                  [column]: e.target.value
                                }));
                                setActiveFilters(prev => ({
                                  ...prev,
                                  [column]: true
                                }));
                              }}
                            />
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className={selectedRows.includes(rowIndex) ? 'bg-muted' : ''}>
                  <TableCell className="w-8">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowIndex)}
                      onChange={() => toggleRowSelection(rowIndex)}
                    />
                  </TableCell>
                  {columns.map(column => (
                    <TableCell key={column}>
                      {editingCell?.row === rowIndex && editingCell?.col === column ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8"
                          />
                          <Button size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="group flex items-center">
                          <span className="flex-1">{row[column]}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => handleEdit(rowIndex, column, row[column])}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DataTable;
