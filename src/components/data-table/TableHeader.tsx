
import { FC } from 'react';
import {
  TableHead,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

interface TableHeaderProps {
  columns: string[];
  sortConfig: SortConfig;
  handleSort: (column: string) => void;
  filters: Record<string, string>;
  setFilters: (filters: Record<string, string>) => void;
  setActiveFilters: (filters: Record<string, boolean>) => void;
  selectedRows: number[];
  data: Record<string, any>[];
  setSelectedRows: (rows: number[]) => void;
}

const TableHeader: FC<TableHeaderProps> = ({
  columns,
  sortConfig,
  handleSort,
  filters,
  setFilters,
  setActiveFilters,
  selectedRows,
  data,
  setSelectedRows
}) => {
  return (
    <TableRow>
      <TableHead className="w-8">
        <input
          type="checkbox"
          checked={selectedRows.length === data.length}
          onChange={(e) => {
            setSelectedRows(
              e.target.checked ? Array.from(Array(data.length).keys()) : []
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
                      // Fixed: Using direct objects instead of updater functions
                      setFilters({
                        ...filters,
                        [column]: e.target.value
                      });
                      
                      // Fixed: Using activeFilters instead of filters
                      setActiveFilters({
                        ...activeFilters,
                        [column]: true
                      });
                    }}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableHead>
      ))}
    </TableRow>
  );
};

export default TableHeader;
