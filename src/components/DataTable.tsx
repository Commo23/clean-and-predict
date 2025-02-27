
import React, { useState, useMemo } from 'react';
import {
  Table, TableHeader, TableBody
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import EditableTableRow from './data-table/TableRow';
import TableHeaderRow from './data-table/TableHeader';
import TableActions from './data-table/TableActions';
import { detectAnomalies, calculateColumnStats } from '@/utils/dataCleaningUtils';

interface DataTableProps {
  data: Record<string, any>[];
  onDataChange: (newData: Record<string, any>[]) => void;
}

const DataTable = ({ data, onDataChange }: DataTableProps) => {
  const { toast } = useToast();
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
  const [dataQualityStats, setDataQualityStats] = useState<Record<string, any>>({});

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.column === column) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    
    setSortConfig({ column: direction ? column : null, direction });
  };

  const showDataQuality = (column: string) => {
    const stats = calculateColumnStats(data, column);
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
    if (!data) return;
    
    const newData = [...data];
    newData[row] = {
      ...newData[row],
      [col]: value
    };
    
    onDataChange(newData);
    
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

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-4">
      <TableActions 
        data={data}
        columns={columns}
        selectedRows={selectedRows}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onDataChange={onDataChange}
        addNewRow={addNewRow}
      />

      <ScrollArea className="h-[500px] rounded-md border">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableHeaderRow 
                columns={columns}
                sortConfig={sortConfig}
                handleSort={handleSort}
                filters={filters}
                setFilters={setFilters}
                setActiveFilters={setActiveFilters}
                selectedRows={selectedRows}
                data={filteredAndSortedData}
                setSelectedRows={setSelectedRows}
              />
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((row, rowIndex) => (
                <EditableTableRow
                  key={rowIndex}
                  row={row}
                  rowIndex={rowIndex}
                  columns={columns}
                  selectedRows={selectedRows}
                  toggleRowSelection={toggleRowSelection}
                  onSaveEdit={handleEdit}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DataTable;
