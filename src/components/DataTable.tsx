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

interface DataTableProps {
  data: any[] | null;
  onDataChange: (newData: any[]) => void;
}

type CleaningMethod = 'mean' | 'median' | 'previous' | 'delete';

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
    const values = data.map(row => row[column]).filter(val => !isNaN(Number(val)));
    const mean = values.reduce((a, b) => a + Number(b), 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(Number(b) - mean, 2), 0) / values.length
    );
    
    return data.reduce((acc: number[], row, idx) => {
      const val = Number(row[column]);
      if (isNaN(val) || val === null || val === undefined || Math.abs(val - mean) > 2 * stdDev) {
        acc.push(idx);
      }
      return acc;
    }, []);
  };

  const cleanData = (method: CleaningMethod) => {
    if (!data || !selectedColumn) return;
    
    const anomalies = detectAnomalies(selectedColumn);
    const newData = [...data];
    const values = data.map(row => Number(row[selectedColumn])).filter(val => !isNaN(val));
    
    switch (method) {
      case 'mean': {
        const replacement = values.reduce((a, b) => a + b, 0) / values.length;
        anomalies.forEach(idx => {
          newData[idx][selectedColumn] = replacement;
        });
        onDataChange(newData);
        break;
      }
      case 'median': {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const replacement = sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
        anomalies.forEach(idx => {
          newData[idx][selectedColumn] = replacement;
        });
        onDataChange(newData);
        break;
      }
      case 'previous': {
        anomalies.forEach(idx => {
          let prevIdx = idx - 1;
          while (prevIdx >= 0 && detectAnomalies(selectedColumn).includes(prevIdx)) {
            prevIdx--;
          }
          if (prevIdx >= 0) {
            newData[idx][selectedColumn] = newData[prevIdx][selectedColumn];
          }
        });
        onDataChange(newData);
        break;
      }
      case 'delete': {
        const filteredData = data.filter((_, idx) => !anomalies.includes(idx));
        onDataChange(filteredData);
        break;
      }
    }
  };

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteRows}
            disabled={selectedRows.length === 0}
          >
            <Trash className="w-4 h-4 mr-1" />
            Delete Selected
          </Button>
          <Button size="sm" onClick={addNewRow}>
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCleaningDialog(true)}
          >
            <Calculator className="w-4 h-4 mr-1" />
            Clean Data
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clean Data</AlertDialogTitle>
            <AlertDialogDescription>
              Select a column and cleaning method to handle anomalies
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={selectedColumn || undefined}
              onValueChange={(value) => {
                setSelectedColumn(value);
                showDataQuality(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map(column => (
                  column && (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>

            {selectedColumn && dataQualityStats[selectedColumn] && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Valeurs manquantes:</span>
                  <span className="font-medium">
                    {dataQualityStats[selectedColumn].missing} 
                    ({dataQualityStats[selectedColumn].missingPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valeurs aberrantes:</span>
                  <span className="font-medium">
                    {dataQualityStats[selectedColumn].outliers}
                    ({dataQualityStats[selectedColumn].outliersPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => cleanData('mean')} variant="outline">
                Replace with Mean
              </Button>
              <Button onClick={() => cleanData('median')} variant="outline">
                Replace with Median
              </Button>
              <Button onClick={() => cleanData('previous')} variant="outline">
                Use Previous Value
              </Button>
              <Button onClick={() => cleanData('delete')} variant="outline">
                Delete Rows
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
