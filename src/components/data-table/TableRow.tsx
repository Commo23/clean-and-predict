
import { FC, useState } from 'react';
import {
  TableRow as UITableRow,
  TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save } from "lucide-react";

interface EditableTableRowProps {
  row: Record<string, any>;
  rowIndex: number;
  columns: string[];
  selectedRows: number[];
  toggleRowSelection: (index: number) => void;
  onSaveEdit: (row: number, col: string, value: string) => void;
}

const EditableTableRow: FC<EditableTableRowProps> = ({
  row,
  rowIndex,
  columns,
  selectedRows,
  toggleRowSelection,
  onSaveEdit
}) => {
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (col: string, value: string) => {
    setEditingCell({ row: rowIndex, col });
    setEditValue(value);
  };

  const handleSave = () => {
    if (!editingCell) return;
    onSaveEdit(editingCell.row, editingCell.col, editValue);
    setEditingCell(null);
  };

  return (
    <UITableRow className={selectedRows.includes(rowIndex) ? 'bg-muted' : ''}>
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
                onClick={() => handleEdit(column, row[column])}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}
        </TableCell>
      ))}
    </UITableRow>
  );
};

export default EditableTableRow;
