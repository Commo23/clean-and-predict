
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface DataUploadProps {
  onDataLoaded: (data: any) => void;
}

const DataUpload = ({ onDataLoaded }: DataUploadProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
      toast({
        title: "Error",
        description: "Could not determine file type",
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
          Papa.parse(event.target?.result as string, {
            header: true,
            complete: (results) => {
              onDataLoaded(results.data);
              toast({
                title: "Success",
                description: "CSV file loaded successfully",
              });
            },
            error: (error) => {
              throw new Error(error.message);
            }
          });
        } else if (['xlsx', 'xls'].includes(extension)) {
          const workbook = XLSX.read(event.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          onDataLoaded(data);
          toast({
            title: "Success",
            description: "Excel file loaded successfully",
          });
        } else if (extension === 'txt') {
          const content = event.target?.result as string;
          const lines = content.split('\n').map(line => line.split('\t'));
          const headers = lines[0];
          const data = lines.slice(1).map(line => 
            Object.fromEntries(headers.map((header, i) => [header, line[i]]))
          );
          onDataLoaded(data);
          toast({
            title: "Success",
            description: "Text file loaded successfully",
          });
        }

        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to parse file",
          variant: "destructive",
        });
      }
    };

    if (['xlsx', 'xls'].includes(extension)) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
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
              <p className="text-lg font-medium">Drop your file here or</p>
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
                  Browse files
                </span>
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Supports CSV, XLS, XLSX, and TXT files
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
