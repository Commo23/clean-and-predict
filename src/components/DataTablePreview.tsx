import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Eye, 
  Filter,
  SortAsc,
  SortDesc,
  Columns,
  Rows
} from 'lucide-react';
import { DataRow } from '@/types';

interface DataTablePreviewProps {
  data: DataRow[];
  title?: string;
  maxRows?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  showStats?: boolean;
  onExport?: () => void;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const DataTablePreview: React.FC<DataTablePreviewProps> = ({
  data,
  title = 'Aperçu des données',
  maxRows = 50,
  showPagination = true,
  showSearch = true,
  showStats = true,
  onExport
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [itemsPerPage] = useState(10);

  // Colonnes disponibles
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const cols = Object.keys(data[0]);
    if (visibleColumns.length === 0) {
      setVisibleColumns(cols.slice(0, 5)); // Afficher les 5 premières colonnes par défaut
    }
    return cols;
  }, [data, visibleColumns]);

  // Données filtrées et triées
  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];

    let filtered = data;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Tri
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Données paginées
  const paginatedData = useMemo(() => {
    if (!showPagination) {
      return filteredAndSortedData.slice(0, maxRows);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, itemsPerPage, showPagination, maxRows]);

  // Statistiques
  const stats = useMemo(() => {
    if (!data) return null;

    const totalRows = data.length;
    const totalColumns = columns.length;
    const filteredRows = filteredAndSortedData.length;
    const totalPages = Math.ceil(filteredRows / itemsPerPage);

    return {
      totalRows,
      totalColumns,
      filteredRows,
      totalPages,
      currentPage,
      itemsPerPage
    };
  }, [data, columns, filteredAndSortedData, currentPage, itemsPerPage]);

  // Gestion du tri
  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.key === column) {
        return {
          key: column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: column, direction: 'asc' };
    });
  };

  // Gestion de la pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Gestion de la recherche
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Retour à la première page lors d'une recherche
  };

  // Gestion des colonnes visibles
  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Aucune donnée à afficher</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {title}
            </CardTitle>
            {showStats && stats && (
              <CardDescription>
                {stats.filteredRows} lignes affichées sur {stats.totalRows} • 
                {stats.totalColumns} colonnes • 
                Page {stats.currentPage} sur {stats.totalPages}
              </CardDescription>
            )}
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Barre d'outils */}
        <div className="flex items-center justify-between mb-4 gap-4">
          {showSearch && (
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les données..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleColumns(columns)}
            >
              <Columns className="h-4 w-4 mr-2" />
              Toutes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleColumns(columns.slice(0, 5))}
            >
              <Rows className="h-4 w-4 mr-2" />
              Principales
            </Button>
          </div>
        </div>

        {/* Sélection des colonnes */}
        <div className="flex flex-wrap gap-2 mb-4">
          {columns.map(column => (
            <Button
              key={column}
              variant={visibleColumns.includes(column) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleColumn(column)}
            >
              {column}
              {sortConfig?.key === column && (
                sortConfig.direction === 'asc' ? 
                  <SortAsc className="h-3 w-3 ml-1" /> : 
                  <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>

        {/* Tableau */}
        <ScrollArea className="h-96 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-1">
                      {column}
                      {sortConfig?.key === column && (
                        sortConfig.direction === 'asc' ? 
                          <SortAsc className="h-3 w-3" /> : 
                          <SortDesc className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={index}>
                  {visibleColumns.map(column => (
                    <TableCell key={column} className="max-w-48 truncate">
                      {String(row[column] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {showPagination && stats && stats.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {((stats.currentPage - 1) * stats.itemsPerPage) + 1} à{' '}
              {Math.min(stats.currentPage * stats.itemsPerPage, stats.filteredRows)} sur{' '}
              {stats.filteredRows} résultats
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(stats.currentPage - 1)}
                disabled={stats.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, stats.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === stats.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(stats.currentPage + 1)}
                disabled={stats.currentPage === stats.totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        {showStats && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Lignes totales:</span>
                <div className="font-medium">{stats?.totalRows}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Colonnes:</span>
                <div className="font-medium">{stats?.totalColumns}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Lignes filtrées:</span>
                <div className="font-medium">{stats?.filteredRows}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Colonnes visibles:</span>
                <div className="font-medium">{visibleColumns.length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTablePreview; 