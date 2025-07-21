
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, X, Settings2, History, Eye } from "lucide-react";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataRow, DataSet, ImportOptions } from '@/types';
import { useUploadHistory } from '@/hooks/useUploadHistory';
import DataTablePreview from './DataTablePreview';
import UploadHistory from './UploadHistory';

interface DataUploadProps {
  onDataLoaded: (data: DataSet | null) => void;
}

const DataUpload = ({ onDataLoaded }: DataUploadProps) => {
  const { toast } = useToast();
  const { addToHistory } = useUploadHistory();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<DataSet | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    useEuropeanFormat: false,
    delimiter: ',',
    encoding: 'UTF-8',
    skipEmptyRows: true,
    trimWhitespace: true,
    autoDetectHeaders: true,
    dateFormat: 'auto',
    numberFormat: 'auto'
  });

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const parseCSVWithFormat = (csvContent: string, europeanFormat: boolean, delimiter: string) => {
    if (europeanFormat) {
      // Remplace temporairement les virgules dans les nombres par un marqueur
      const tempContent = csvContent.replace(/(\d+),(\d+)/g, '$1#$2');
      
      return Papa.parse(tempContent, {
        header: true,
        delimiter: delimiter,
        transformHeader: (header) => header.trim(),
        transform: (value) => {
          // Restaure les virgules décimales en points et convertit en nombre si possible
          const transformed = value.replace(/#/g, '.');
          const num = parseFloat(transformed);
          return isNaN(num) ? transformed : num;
        },
        complete: (results) => {
          return results.data;
        }
      });
    } else {
      return Papa.parse(csvContent, {
        header: true,
        delimiter: delimiter,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          return results.data;
        }
      });
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
      toast({
        title: "Erreur",
        description: "Impossible de déterminer le type de fichier",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      }
    };

    reader.onload = (event) => {
      try {
        if (extension === 'csv') {
          const csvContent = event.target?.result as string;
          const results = parseCSVWithFormat(csvContent, importOptions.useEuropeanFormat, importOptions.delimiter);
          
          const dataSet: DataSet = {
            data: results.data as DataRow[],
            columns: results.meta?.fields || [],
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              uploadDate: new Date(),
              rowCount: results.data.length,
              columnCount: results.meta?.fields?.length || 0
            }
          };
          
          setCurrentData(dataSet);
          setShowPreview(true);
          
          // Ajouter à l'historique
          addToHistory({
            fileName: file.name,
            fileSize: file.size,
            uploadDate: new Date(),
            dataSet,
            importOptions,
            preview: dataSet.data.slice(0, 10)
          });
          
          toast({
            title: "Succès",
            description: "Fichier CSV chargé avec succès. Aperçu disponible.",
          });
        } else if (['xlsx', 'xls'].includes(extension)) {
          const workbook = XLSX.read(event.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Traitement spécifique pour le format européen si nécessaire
          const options = importOptions.useEuropeanFormat 
            ? { raw: false, dateNF: 'dd/mm/yyyy' } 
            : undefined;
            
          const rawData = XLSX.utils.sheet_to_json(worksheet, options) as DataRow[];
          const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
          
          const dataSet: DataSet = {
            data: rawData,
            columns,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              uploadDate: new Date(),
              rowCount: rawData.length,
              columnCount: columns.length
            }
          };
          
          setCurrentData(dataSet);
          setShowPreview(true);
          
          // Ajouter à l'historique
          addToHistory({
            fileName: file.name,
            fileSize: file.size,
            uploadDate: new Date(),
            dataSet,
            importOptions,
            preview: dataSet.data.slice(0, 10)
          });
          
          toast({
            title: "Succès",
            description: "Fichier Excel chargé avec succès. Aperçu disponible.",
          });
        } else if (extension === 'txt') {
          const content = event.target?.result as string;
          const lines = content.split('\n').map(line => line.split(importOptions.delimiter));
          const headers = lines[0];
          const rawData = lines.slice(1).map(line => 
            Object.fromEntries(headers.map((header, i) => [header, line[i]]))
          ) as DataRow[];
          
          const dataSet: DataSet = {
            data: rawData,
            columns: headers,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              uploadDate: new Date(),
              rowCount: rawData.length,
              columnCount: headers.length
            }
          };
          
          setCurrentData(dataSet);
          setShowPreview(true);
          
          // Ajouter à l'historique
          addToHistory({
            fileName: file.name,
            fileSize: file.size,
            uploadDate: new Date(),
            dataSet,
            importOptions,
            preview: dataSet.data.slice(0, 10)
          });
          
          toast({
            title: "Succès",
            description: "Fichier texte chargé avec succès. Aperçu disponible.",
          });
        }

        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Échec de l'analyse du fichier",
          variant: "destructive",
        });
      }
    };

    if (['xlsx', 'xls'].includes(extension)) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file, importOptions.encoding);
    }
  };

  // Confirmer l'utilisation des données
  const confirmDataUsage = () => {
    if (currentData) {
      console.log('Confirmation des données:', currentData); // Debug
      onDataLoaded(currentData);
      setShowPreview(false);
      setActiveTab('upload'); // Retour à l'onglet upload
      toast({
        title: "Données confirmées",
        description: "Les données sont maintenant disponibles pour l'analyse",
      });
    }
  };

  // Charger depuis l'historique
  const handleLoadFromHistory = (dataset: DataSet) => {
    setCurrentData(dataset);
    setShowPreview(true);
    setActiveTab('preview');
    toast({
      title: "Données chargées",
      description: "Données chargées depuis l'historique",
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Importation de données</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Options d'importation
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Options d'importation de données</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delimiter">Séparateur CSV</Label>
                  <Select value={importOptions.delimiter} onValueChange={(value) => setImportOptions(prev => ({ ...prev, delimiter: value }))}>
                    <SelectTrigger id="delimiter">
                      <SelectValue placeholder="Choisir un séparateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Virgule (,)</SelectItem>
                      <SelectItem value=";">Point-virgule (;)</SelectItem>
                      <SelectItem value="\t">Tabulation</SelectItem>
                      <SelectItem value="|">Barre verticale (|)</SelectItem>
                      <SelectItem value=";">Espace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="encoding">Encodage</Label>
                  <Select value={importOptions.encoding} onValueChange={(value) => setImportOptions(prev => ({ ...prev, encoding: value }))}>
                    <SelectTrigger id="encoding">
                      <SelectValue placeholder="Choisir un encodage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
                      <SelectItem value="windows-1252">Windows-1252</SelectItem>
                      <SelectItem value="UTF-16">UTF-16</SelectItem>
                      <SelectItem value="ASCII">ASCII</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Format des données</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="european-format" className="text-sm">Format européen (virgule décimale)</Label>
                    <Switch 
                      id="european-format" 
                      checked={importOptions.useEuropeanFormat} 
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, useEuropeanFormat: checked }))} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-headers" className="text-sm">Détection automatique des en-têtes</Label>
                    <Switch 
                      id="auto-headers" 
                      checked={importOptions.autoDetectHeaders} 
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, autoDetectHeaders: checked }))} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nettoyage des données</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="skip-empty" className="text-sm">Ignorer les lignes vides</Label>
                    <Switch 
                      id="skip-empty" 
                      checked={importOptions.skipEmptyRows} 
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, skipEmptyRows: checked }))} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trim-whitespace" className="text-sm">Supprimer les espaces</Label>
                    <Switch 
                      id="trim-whitespace" 
                      checked={importOptions.trimWhitespace} 
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, trimWhitespace: checked }))} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Format des dates</Label>
                <Select value={importOptions.dateFormat} onValueChange={(value) => setImportOptions(prev => ({ ...prev, dateFormat: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format de date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Détection automatique</SelectItem>
                    <SelectItem value="dd/mm/yyyy">JJ/MM/AAAA</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/JJ/AAAA</SelectItem>
                    <SelectItem value="yyyy-mm-dd">AAAA-MM-JJ</SelectItem>
                    <SelectItem value="dd-mm-yyyy">JJ-MM-AAAA</SelectItem>
                    <SelectItem value="dd.mm.yyyy">JJ.MM.AAAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-rows">Nombre maximum de lignes (optionnel)</Label>
                <input
                  id="max-rows"
                  type="number"
                  min="1"
                  max="100000"
                  placeholder="Toutes les lignes"
                  className="w-full p-2 border rounded-md"
                  value={importOptions.maxRows || ''}
                  onChange={(e) => setImportOptions(prev => ({ 
                    ...prev, 
                    maxRows: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                toast({
                  title: "Options appliquées",
                  description: "Les options d'importation ont été mises à jour",
                });
              }}>
                Appliquer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${fileName ? 'bg-gray-50' : 'hover:bg-gray-50'}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {fileName ? (
          <div className="flex items-center justify-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            <span className="font-medium">{fileName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => {
                setFileName(null);
                onDataLoaded(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="text-lg font-medium">Déposez votre fichier ici ou</p>
              <label className="inline-flex items-center mt-2">
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <span className="btn-primary cursor-pointer">
                  Parcourir les fichiers
                </span>
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Formats supportés: CSV, XLS, XLSX et TXT
              {importOptions.useEuropeanFormat && <span className="block text-primary font-medium mt-1">Format européen activé (virgule comme séparateur décimal)</span>}
            </p>
          </div>
        )}
      </div>

      {uploadProgress > 0 && (
        <Progress value={uploadProgress} className="w-full" />
      )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {currentData && showPreview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Aperçu des données</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={confirmDataUsage}
                  >
                    Confirmer et utiliser
                  </Button>
                </div>
              </div>
              <DataTablePreview
                data={currentData.data}
                title={`Aperçu de ${currentData.metadata?.fileName || 'fichier'}`}
                maxRows={100}
                showPagination={true}
                showSearch={true}
                showStats={true}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Aucun aperçu disponible</p>
              <p className="text-muted-foreground">
                Uploadez un fichier pour voir l'aperçu des données
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <UploadHistory onLoadDataset={handleLoadFromHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataUpload;
