import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Database, 
  Search, 
  Star, 
  Edit, 
  Trash, 
  Download, 
  Eye, 
  Calendar,
  Tag,
  Folder,
  FileText,
  BarChart3,
  Heart,
  MoreVertical,
  FileSpreadsheet,
  HardDrive,
  RefreshCw,
  TrendingUp,
  Activity,
  PieChart,
  Grid3X3,
  List,
  BarChart,
  Clock,
  Brain,
  Rocket,
  Sparkles,
  Layers
} from 'lucide-react';
import { DataSet } from '@/types';
import { useUploadHistory } from '@/hooks/useUploadHistory';
import { exportToCSV, exportToJSON, exportToExcel } from '@/utils/exportUtils';
import LoadingSpinner from './LoadingSpinner';
import FullDataPreview from './FullDataPreview';

interface MyDataFromHistoryProps {
  currentData: DataSet | null;
  onLoadDataset: (dataset: DataSet) => void;
}

const CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories', icon: Database, color: 'bg-blue-500' },
  { value: 'personal', label: 'Personnel', icon: Heart, color: 'bg-pink-500' },
  { value: 'work', label: 'Travail', icon: FileText, color: 'bg-green-500' },
  { value: 'research', label: 'Recherche', icon: BarChart3, color: 'bg-purple-500' },
  { value: 'other', label: 'Autre', icon: Folder, color: 'bg-gray-500' }
];

const MyDataFromHistory: React.FC<MyDataFromHistoryProps> = ({ currentData, onLoadDataset }) => {
  const { toast } = useToast();
  const {
    history,
    updateHistoryItem,
    removeFromHistory,
    toggleFavorite,
    searchHistory,
    filterByCategory,
    getFavorites,
    getHistoryStats
  } = useUploadHistory();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Formulaire d'édition
  const [editForm, setEditForm] = useState({
    title: '',
    notes: '',
    tags: '',
    category: 'other' as 'personal' | 'work' | 'research' | 'other'
  });

  // Filtrer et rechercher les éléments
  const filteredHistory = useMemo(() => {
    let items = history;

    // Filtrer par onglet
    if (activeTab === 'favorites') {
      items = getFavorites();
    } else if (activeTab === 'recent') {
      items = [...items].sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()).slice(0, 10);
    }

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      items = filterByCategory(selectedCategory as any);
    }

    // Rechercher
    if (searchQuery.trim()) {
      items = searchHistory(searchQuery);
    }

    return items;
  }, [history, activeTab, selectedCategory, searchQuery, getFavorites, filterByCategory, searchHistory]);

  // Statistiques
  const stats = getHistoryStats();

  // Analyser les données pour les aperçus
  const analyzeDataForPreview = (dataSet: DataSet) => {
    try {
      if (!dataSet || !dataSet.data || dataSet.data.length === 0) return null;

      const data = dataSet.data.slice(0, 5); // Limiter pour les aperçus
      const columns = dataSet.columns || [];
      
      if (columns.length === 0) return null;
      
      // Trouver les colonnes numériques
      const numericColumns = columns.filter((col, index) => {
        try {
          const sampleValues = data.slice(0, 3).map(row => {
            if (Array.isArray(row)) {
              return row[index];
            } else if (typeof row === 'object' && row !== null) {
              return row[col];
            }
            return null;
          });
          return sampleValues.some(val => {
            if (val === null || val === undefined || val === '') return false;
            const num = Number(val);
            return !isNaN(num) && isFinite(num);
          });
        } catch (error) {
          return false;
        }
      });

      return {
        numericColumns,
        hasNumericData: numericColumns.length > 0,
        sampleData: data,
        totalRows: dataSet.data.length,
        totalColumns: columns.length
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse des données:', error);
      return null;
    }
  };

  // Charger un dataset
  const handleLoadDataset = (item: any) => {
    try {
      onLoadDataset(item.dataSet);
      toast({
        title: "Dataset chargé",
        description: `"${item.title || item.fileName}" a été chargé avec succès`,
      });
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le dataset",
        variant: "destructive"
      });
    }
  };

  // Supprimer un élément
  const handleDeleteItem = (item: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.title || item.fileName}" ?`)) {
      try {
        removeFromHistory(item.id);
        toast({
          title: "Élément supprimé",
          description: `"${item.title || item.fileName}" a été supprimé de l'historique`,
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'élément",
          variant: "destructive"
        });
      }
    }
  };

  // Exporter un dataset
  const handleExportDataset = async (item: any, format: 'csv' | 'json' | 'excel') => {
    setLoading(true);
    try {
      const fileName = item.title || item.fileName;
      const data = item.dataSet.data || [];
      
      if (data.length === 0) {
        throw new Error('Aucune donnée à exporter');
      }

      switch (format) {
        case 'csv':
          exportToCSV(data, `${fileName}.csv`);
          break;
        case 'json':
          exportToJSON(data, `${fileName}.json`);
          break;
        case 'excel':
          await exportToExcel(data, `${fileName}.xlsx`);
          break;
      }
      toast({
        title: "Export réussi",
        description: `"${fileName}" a été exporté en ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Erreur d\'export:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'export",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dialogue d'édition
  const handleEditItem = (item: any) => {
    setEditingItem(item.id);
    setEditForm({
      title: item.title || item.fileName,
      notes: item.notes || '',
      tags: (item.tags || []).join(', '),
      category: item.category || 'other'
    });
  };

  // Sauvegarder les modifications
  const handleSaveEdit = () => {
    if (!editingItem) return;

    try {
      const tags = editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      updateHistoryItem(editingItem, {
        title: editForm.title,
        notes: editForm.notes,
        tags,
        category: editForm.category
      });

      toast({
        title: "Modifications sauvegardées",
        description: "Les métadonnées ont été mises à jour",
      });

      setEditingItem(null);
      setEditForm({ title: '', notes: '', tags: '', category: 'other' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive"
      });
    }
  };

  // Formater la date
  const formatDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Formater la taille de fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* En-tête futuriste avec statistiques */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Database className="h-6 w-6" />
                </div>
                Dashboard de Mes Données
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </CardTitle>
              <CardDescription className="text-blue-100">
                Centre de contrôle futuriste pour vos datasets
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold flex items-center justify-center gap-2">
                <Database className="h-6 w-6" />
                {stats.totalFiles}
              </div>
              <div className="text-blue-100">Datasets</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold flex items-center justify-center gap-2">
                <Star className="h-6 w-6 text-yellow-300" />
                {stats.favorites}
              </div>
              <div className="text-blue-100">Favoris</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                {stats.totalRows.toLocaleString()}
              </div>
              <div className="text-blue-100">Lignes</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold flex items-center justify-center gap-2">
                <Layers className="h-6 w-6" />
                {stats.totalColumns.toLocaleString()}
              </div>
              <div className="text-blue-100">Colonnes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres et recherche futuristes */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="🔍 Rechercher dans vos datasets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-0 shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex bg-white/80 backdrop-blur-sm rounded-md border-0 shadow-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets futuristes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Rocket className="h-4 w-4 mr-2" />
            Dashboard ({stats.totalFiles})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Star className="h-4 w-4 mr-2" />
            Favoris ({stats.favorites})
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Clock className="h-4 w-4 mr-2" />
            Récents
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Brain className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {filteredHistory.length === 0 ? (
            <Card className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 border-0">
              <CardContent>
                <div className="p-4 bg-white/50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Database className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {history.length === 0 ? 'Aucun dataset trouvé' : 'Aucun résultat'}
                </h3>
                <p className="text-gray-500">
                  {history.length === 0 
                    ? 'Commencez par uploader votre premier fichier' 
                    : 'Essayez de modifier vos critères de recherche'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Vue Grille Futuriste */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHistory.map((item) => (
                    <DatasetPreviewCard
                      key={item.id}
                      item={item}
                      onLoad={handleLoadDataset}
                      onDelete={handleDeleteItem}
                      onExport={handleExportDataset}
                      onToggleFavorite={toggleFavorite}
                      onEdit={handleEditItem}
                      formatDate={formatDate}
                      formatFileSize={formatFileSize}
                      analyzeData={analyzeDataForPreview}
                    />
                  ))}
                </div>
              )}

              {/* Vue Liste Futuriste */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filteredHistory.map((item) => (
                    <DatasetListCard
                      key={item.id}
                      item={item}
                      onLoad={handleLoadDataset}
                      onDelete={handleDeleteItem}
                      onExport={handleExportDataset}
                      onToggleFavorite={toggleFavorite}
                      onEdit={handleEditItem}
                      formatDate={formatDate}
                      formatFileSize={formatFileSize}
                      analyzeData={analyzeDataForPreview}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFavorites().map((item) => (
              <DatasetPreviewCard
                key={item.id}
                item={item}
                onLoad={handleLoadDataset}
                onDelete={handleDeleteItem}
                onExport={handleExportDataset}
                onToggleFavorite={toggleFavorite}
                onEdit={handleEditItem}
                formatDate={formatDate}
                formatFileSize={formatFileSize}
                analyzeData={analyzeDataForPreview}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history
              .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
              .slice(0, 10)
              .map((item) => (
                <DatasetPreviewCard
                  key={item.id}
                  item={item}
                  onLoad={handleLoadDataset}
                  onDelete={handleDeleteItem}
                  onExport={handleExportDataset}
                  onToggleFavorite={toggleFavorite}
                  onEdit={handleEditItem}
                  formatDate={formatDate}
                  formatFileSize={formatFileSize}
                  analyzeData={analyzeDataForPreview}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques globales */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Statistiques Globales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                    <span className="font-medium">Total Datasets</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.totalFiles}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                    <span className="font-medium">Favoris</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {stats.favorites}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                    <span className="font-medium">Lignes Total</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {stats.totalRows.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                    <span className="font-medium">Colonnes Total</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {stats.totalColumns.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Répartition par catégorie */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Répartition par Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${(count / stats.totalFiles) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogue d'édition */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les métadonnées</DialogTitle>
            <DialogDescription>
              Personnalisez le titre, les notes et la catégorie de votre dataset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du dataset..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Description, contexte, utilisation..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={editForm.tags}
                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catégorie</label>
              <Select
                value={editForm.category}
                onValueChange={(value: any) => setEditForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personnel</SelectItem>
                  <SelectItem value="work">Travail</SelectItem>
                  <SelectItem value="research">Recherche</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex justify-center">
          <LoadingSpinner text="Export en cours..." />
        </div>
      )}
    </div>
  );
};

// Composant pour afficher une carte d'aperçu de dataset
interface DatasetPreviewCardProps {
  item: any;
  onLoad: (item: any) => void;
  onDelete: (item: any) => void;
  onExport: (item: any, format: 'csv' | 'json' | 'excel') => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (item: any) => void;
  formatDate: (date: Date) => string;
  formatFileSize: (bytes: number) => string;
  analyzeData: (dataSet: DataSet) => any;
}

const DatasetPreviewCard: React.FC<DatasetPreviewCardProps> = ({
  item,
  onLoad,
  onDelete,
  onExport,
  onToggleFavorite,
  onEdit,
  formatDate,
  formatFileSize,
  analyzeData
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const analysis = useMemo(() => {
    try {
      return analyzeData(item.dataSet);
    } catch (error) {
      console.error('Erreur lors de l\'analyse du dataset:', error);
      return null;
    }
  }, [item.dataSet, analyzeData]);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate flex items-center gap-2">
              {item.title || item.fileName}
              {item.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {item.notes || 'Aucune description'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(item.id)}
              className="hover:bg-yellow-100"
            >
              {item.isFavorite ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-blue-50">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Aperçu des données tabulaires */}
        {analysis && analysis.sampleData && analysis.sampleData.length > 0 && (
          <div className="bg-white rounded-lg p-3 border mb-4">
            <div className="text-xs font-medium text-gray-600 mb-2">Aperçu des données</div>
            <div className="space-y-1">
              {analysis.sampleData.slice(0, 3).map((row, rowIndex) => (
                <div key={rowIndex} className="text-xs text-gray-700 flex gap-2">
                  {Array.isArray(row) ? (
                    row.slice(0, 3).map((cell, cellIndex) => (
                      <span key={cellIndex} className="truncate flex-1">
                        {String(cell || '').slice(0, 15)}
                      </span>
                    ))
                  ) : (
                    Object.values(row || {}).slice(0, 3).map((cell, cellIndex) => (
                      <span key={cellIndex} className="truncate flex-1">
                        {String(cell || '').slice(0, 15)}
                      </span>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton pour voir l'aperçu complet */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-4"
          onClick={() => setShowFullPreview(true)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir l'aperçu complet
        </Button>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center bg-blue-50 rounded-lg p-2">
            <div className="text-lg font-semibold text-blue-600">
              {item.dataSet.data?.length.toLocaleString() || 0}
            </div>
            <div className="text-xs text-blue-500">Lignes</div>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-2">
            <div className="text-lg font-semibold text-green-600">
              {item.dataSet.columns?.length || 0}
            </div>
            <div className="text-xs text-green-500">Colonnes</div>
          </div>
        </div>

        {/* Métadonnées */}
        <div className="space-y-2 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Uploadé le {formatDate(item.uploadDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(item.fileSize)}</span>
          </div>
          {item.category && (
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3" />
              <span className="capitalize">{item.category}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            onClick={() => onLoad(item)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Charger
          </Button>
          
          {showActions && (
            <div className="absolute top-2 right-2 bg-white border rounded-lg shadow-lg p-2 z-10">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onExport(item, 'csv')}
                >
                  <Download className="h-3 w-3 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onExport(item, 'excel')}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => onDelete(item)}
                >
                  <Trash className="h-3 w-3 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialogue d'aperçu complet */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Aperçu de {item.title || item.fileName}
            </DialogTitle>
            <DialogDescription>
              {item.dataSet.data?.length || 0} lignes affichées sur {item.dataSet.data?.length || 0} • {item.dataSet.columns?.length || 0} colonnes
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <FullDataPreview 
              dataSet={item.dataSet}
              onClose={() => setShowFullPreview(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Composant pour afficher une carte de liste de dataset
const DatasetListCard: React.FC<DatasetPreviewCardProps> = ({
  item,
  onLoad,
  onDelete,
  onExport,
  onToggleFavorite,
  onEdit,
  formatDate,
  formatFileSize,
  analyzeData
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-gray-50 border-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate flex items-center gap-2">
                {item.title || item.fileName}
                {item.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {item.notes || 'Aucune description'}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span>{item.dataSet.data?.length || 0} lignes</span>
                <span>{item.dataSet.columns?.length || 0} colonnes</span>
                <span>{formatFileSize(item.fileSize)}</span>
                <span>{formatDate(item.uploadDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(item.id)}
            >
              {item.isFavorite ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => onLoad(item)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Charger
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyDataFromHistory; 