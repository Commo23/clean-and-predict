
import { FC } from 'react';
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import DataCleaningDialog from '../data-cleaning/DataCleaningDialog';

interface TableActionsProps {
  data: Record<string, any>[];
  columns: string[];
  selectedRows: number[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onDataChange: (newData: Record<string, any>[]) => void;
  addNewRow: () => void;
}

const TableActions: FC<TableActionsProps> = ({
  data,
  columns,
  selectedRows,
  searchTerm,
  setSearchTerm,
  onDataChange,
  addNewRow
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="space-x-2">
        <DataCleaningDialog 
          data={data} 
          columns={columns}
          onDataChange={onDataChange}
        />
        <Button size="sm" onClick={addNewRow}>
          <Plus className="w-4 h-4 mr-1" />
          Add Row
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <Input
            placeholder="Search in all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {selectedRows.length} row(s) selected
        </div>
      </div>
    </div>
  );
};

export default TableActions;
