import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Eye,
  EyeOff,
  Download,
  RefreshCw
} from 'lucide-react';
import { DataSet } from '@/types';

interface FullDataPreviewProps {
  dataSet: DataSet;
  onClose: () => void;
}

const FullDataPreview: React.FC<FullDataPreviewProps> = ({ dataSet, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(dataSet.columns || []);
  const [itemsPerPage] = useState(10);

  // Filtrer les données selon la recherche
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !dataSet.data) return dataSet.data || [];
    
    const query = searchQuery.toLowerCase();
    return dataSet.data.filter(row => {
      if (Array.isArray(row)) {
        return row.some(cell => String(cell).toLowerCase().includes(query));
      } else if (typeof row === 'object' && row !== null) {
        return Object.values(row).some(value => String(value).toLowerCase().includes(query));
      }
      return false;
    });
  }, [dataSet.data, searchQuery]);

  // Calculer la pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Basculer la visibilité d'une colonne
  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  // Basculer toutes les colonnes
  const toggleAllColumns = () => {
    setVisibleColumns(prev => 
      prev.length === dataSet.columns?.length 
        ? [] 
        : dataSet.columns || []
    );
  };

  // Basculer les colonnes principales (premières 5)
  const toggleMainColumns = () => {
    const mainColumns = dataSet.columns?.slice(0, 5) || [];
    setVisibleColumns(mainColumns);
  };

  // Formater une valeur de cellule
  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR');
    }
    return String(value);
  };

  // Obtenir les en-têtes visibles
  const visibleHeaders = dataSet.columns?.filter(col => visibleColumns.includes(col)) || [];

  return (
    <div className="flex flex-col h-full">
      {/* En-tête avec recherche et filtres */}
      <div className="border-b p-4 space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les données..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres de colonnes */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Colonnes visibles:</span>
          {dataSet.columns?.map((column) => (
            <Button
              key={column}
              variant={visibleColumns.includes(column) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleColumn(column)}
              className="text-xs"
            >
              {visibleColumns.includes(column) ? (
                <Eye className="h-3 w-3 mr-1" />
              ) : (
                <EyeOff className="h-3 w-3 mr-1" />
              )}
              {column}
            </Button>
          ))}
          <div className="flex gap-1 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllColumns}
              className="text-xs"
            >
              {visibleColumns.length === dataSet.columns?.length ? 'Masquer tout' : 'Toutes'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMainColumns}
              className="text-xs"
            >
              Principales
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{filteredData.length} lignes affichées sur {dataSet.data?.length || 0}</span>
          <span>•</span>
          <span>{dataSet.columns?.length || 0} colonnes</span>
          <span>•</span>
          <span>Page {currentPage} sur {totalPages}</span>
        </div>
      </div>

      {/* Tableau de données */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* En-têtes du tableau */}
          <div className="sticky top-0 bg-white border-b z-10">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleHeaders.length}, minmax(120px, 1fr))` }}>
              {visibleHeaders.map((header) => (
                <div
                  key={header}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r last:border-r-0"
                >
                  {header}
                </div>
              ))}
            </div>
          </div>

          {/* Lignes de données */}
          <div className="divide-y">
            {currentData.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid hover:bg-gray-50 transition-colors"
                style={{ gridTemplateColumns: `repeat(${visibleHeaders.length}, minmax(120px, 1fr))` }}
              >
                {visibleHeaders.map((header, colIndex) => {
                  let cellValue;
                  if (Array.isArray(row)) {
                    const headerIndex = dataSet.columns?.indexOf(header) || 0;
                    cellValue = row[headerIndex];
                  } else if (typeof row === 'object' && row !== null) {
                    cellValue = row[header];
                  } else {
                    cellValue = row;
                  }

                  return (
                    <div
                      key={colIndex}
                      className="px-3 py-2 text-sm text-gray-900 border-r last:border-r-0 truncate"
                      title={String(cellValue || '')}
                    >
                      {formatCellValue(cellValue)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredData.length)} sur {filteredData.length} résultats
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                if (totalPages <= 5) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                
                // Logique pour afficher les pages avec ellipsis
                if (pageNum === 1 || pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées en bas */}
      <div className="border-t p-4 bg-gray-50">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Lignes totales:</span> {dataSet.data?.length || 0}
          </div>
          <div>
            <span className="font-medium">Colonnes:</span> {dataSet.columns?.length || 0}
          </div>
          <div>
            <span className="font-medium">Lignes filtrées:</span> {filteredData.length}
          </div>
          <div>
            <span className="font-medium">Colonnes visibles:</span> {visibleColumns.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullDataPreview; 