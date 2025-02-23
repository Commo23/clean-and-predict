
import { useState, useMemo } from 'react';
import { Table } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Save, Trash, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DataTableProps {
  data: any[] | null;
  onDataChange: (newData: any[]) => void;
}

const DataTable = ({ data, onDataChange }: DataTableProps) => {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

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
        </div>
        <div className="text-sm text-gray-500">
          {selectedRows.length} row(s) selected
        </div>
      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-8 p-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length}
                    onChange={(e) => {
                      setSelectedRows(
                        e.target.checked ? Array.from(Array(data.length).keys()) : []
                      );
                    }}
                  />
                </th>
                {columns.map(column => (
                  <th key={column} className="text-left p-2 bg-gray-50">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className={selectedRows.includes(rowIndex) ? 'bg-gray-50' : ''}>
                  <td className="w-8 p-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowIndex)}
                      onChange={() => toggleRowSelection(rowIndex)}
                    />
                  </td>
                  {columns.map(column => (
                    <td key={column} className="p-2 border-t">
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
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DataTable;
