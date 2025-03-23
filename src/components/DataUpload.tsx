
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, X, Settings2 } from "lucide-react";
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

interface DataUploadProps {
  onDataLoaded: (data: any) => void;
}

const DataUpload = ({ onDataLoaded }: DataUploadProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [useEuropeanFormat, setUseEuropeanFormat] = useState(false);
  const [delimiter, setDelimiter] = useState(',');
  const [encoding, setEncoding] = useState('UTF-8');

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
          const results = parseCSVWithFormat(csvContent, useEuropeanFormat, delimiter);
          
          onDataLoaded(results.data);
          toast({
            title: "Succès",
            description: "Fichier CSV chargé avec succès",
          });
        } else if (['xlsx', 'xls'].includes(extension)) {
          const workbook = XLSX.read(event.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Traitement spécifique pour le format européen si nécessaire
          const options = useEuropeanFormat 
            ? { raw: false, dateNF: 'dd/mm/yyyy' } 
            : undefined;
            
          const data = XLSX.utils.sheet_to_json(worksheet, options);
          
          onDataLoaded(data);
          toast({
            title: "Succès",
            description: "Fichier Excel chargé avec succès",
          });
        } else if (extension === 'txt') {
          const content = event.target?.result as string;
          const lines = content.split('\n').map(line => line.split(delimiter));
          const headers = lines[0];
          const data = lines.slice(1).map(line => 
            Object.fromEntries(headers.map((header, i) => [header, line[i]]))
          );
          onDataLoaded(data);
          toast({
            title: "Succès",
            description: "Fichier texte chargé avec succès",
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
      reader.readAsText(file, encoding);
    }
  };

  return (
    <div className="space-y-4">
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
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="european-format">Format européen (virgule comme séparateur décimal)</Label>
                <Switch 
                  id="european-format" 
                  checked={useEuropeanFormat} 
                  onCheckedChange={setUseEuropeanFormat} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delimiter">Séparateur CSV</Label>
                <Select value={delimiter} onValueChange={setDelimiter}>
                  <SelectTrigger id="delimiter">
                    <SelectValue placeholder="Choisir un séparateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Virgule (,)</SelectItem>
                    <SelectItem value=";">Point-virgule (;)</SelectItem>
                    <SelectItem value="\t">Tabulation</SelectItem>
                    <SelectItem value="|">Barre verticale (|)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="encoding">Encodage</Label>
                <Select value={encoding} onValueChange={setEncoding}>
                  <SelectTrigger id="encoding">
                    <SelectValue placeholder="Choisir un encodage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTF-8">UTF-8</SelectItem>
                    <SelectItem value="ISO-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
                    <SelectItem value="windows-1252">Windows-1252</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Appliquer</Button>
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
              {useEuropeanFormat && <span className="block text-primary font-medium mt-1">Format européen activé (virgule comme séparateur décimal)</span>}
            </p>
          </div>
        )}
      </div>

      {uploadProgress > 0 && (
        <Progress value={uploadProgress} className="w-full" />
      )}
    </div>
  );
};

export default DataUpload;
