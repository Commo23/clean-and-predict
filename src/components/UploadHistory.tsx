import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  FileText, 
  Calendar, 
  HardDrive, 
  Download, 
  Trash2, 
  RefreshCw,
  Eye,
  Clock,
  Database
} from 'lucide-react';
import { useUploadHistory } from '@/hooks/useUploadHistory';
import { DataSet } from '@/types';

interface UploadHistoryProps {
  onLoadDataset: (dataset: DataSet) => void;
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ onLoadDataset }) => {
  const { 
    history, 
    removeFromHistory, 
    clearHistory, 
    loadFromHistory, 
    getHistoryStats 
  } = useUploadHistory();
  
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const stats = getHistoryStats();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleLoadDataset = (id: string) => {
    const dataset = loadFromHistory(id);
    if (dataset) {
      onLoadDataset(dataset);
    }
  };

  const handleRemoveItem = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeFromHistory(id);
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des Uploads
          </CardTitle>
          <CardDescription>
            Aucun fichier dans l'historique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Les fichiers que vous uploadez apparaîtront ici pour un accès rapide
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des Uploads
            </CardTitle>
            <CardDescription>
              {stats.totalFiles} fichiers • {formatFileSize(stats.totalSize)}
              {stats.lastUpload && (
                <span className="ml-2">
                  • Dernier: {formatDate(stats.lastUpload)}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Vider
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {history.map((item) => (
              <Card
                key={item.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedItem === item.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedItem(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{item.fileName}</h4>
                        <Badge variant="secondary">
                          {item.dataSet.data.length} lignes
                        </Badge>
                        <Badge variant="outline">
                          {item.dataSet.columns.length} colonnes
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(item.fileSize)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.uploadDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.dataSet.metadata?.uploadDate ? 
                            formatDate(new Date(item.dataSet.metadata.uploadDate)) : 
                            'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadDataset(item.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Charger
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRemoveItem(item.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Aperçu des données */}
                {selectedItem === item.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium mb-2">Aperçu des données</h5>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Colonnes:</span>
                          <div className="font-medium">
                            {item.dataSet.columns.slice(0, 3).join(', ')}
                            {item.dataSet.columns.length > 3 && '...'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Première ligne:</span>
                          <div className="font-medium text-xs truncate">
                            {Object.values(item.dataSet.data[0] || {}).slice(0, 3).join(', ')}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Options:</span>
                          <div className="font-medium text-xs">
                            {item.importOptions?.delimiter || 'auto'} • {item.importOptions?.encoding || 'auto'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actions:</span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadDataset(item.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Recharger
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UploadHistory; 