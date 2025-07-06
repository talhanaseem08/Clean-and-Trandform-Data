import { useState, useCallback, useRef, ChangeEvent } from "react";
import { Upload, FileText, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

interface StagedFile {
  file: File;
  rowCount: number;
  columnCount: number;
}

interface UploadZoneProps {
  onDataProcessed: (data: any[]) => void;
  onSuccess: () => void;
  
}

export function UploadZone({ onDataProcessed, onSuccess }: UploadZoneProps) {

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [options, setOptions] = useState({
    removeDuplicates: true,
    handleMissing: true,
    detectOutliers: true,
    standardizeData: true,
  });

  // UI/Error states
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleAddFile = (file: File) => {
    setError(null);
    let rowCount = 0;
    let columnCount = 0;
    Papa.parse(file, {
      header: true,
      step: (results) => {
        if (rowCount === 0) { 
          columnCount = results.meta.fields?.length || 0;
        }
        rowCount++;
      },
      complete: () => {
        const newFile: StagedFile = { file, rowCount, columnCount };
        setStagedFiles(prevFiles => [...prevFiles, newFile]);
      },
      error: () => {
        setError("Failed to parse the CSV file.");
      }
    });
  };
  const removeFile = (fileName: string) => {
    setStagedFiles(prevFiles => prevFiles.filter(item => item.file.name !== fileName));
  };
  
  const handleProcessFiles = async () => {
    if (stagedFiles.length === 0) {
        setError("Please upload at least one file to process.");
        return;
    }

    setIsProcessing(true);
    setError(null);
    const token = localStorage.getItem('authToken');

    if (!token) {
        setError("Authentication error. Please log in again.");
        setIsProcessing(false);
        return;
    }

    const processPromise = Promise.all(
      stagedFiles.map(stagedFile => {
        const formData = new FormData();
        formData.append("file", stagedFile.file);
        formData.append("options", JSON.stringify(options));
        
        return api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
        }).then(response => response.data);
      })
    );

    toast.promise(processPromise, {
      loading: `Processing ${stagedFiles.length} file(s)...`,
      success: (results) => {
        onDataProcessed(results.map((result, index) => ({
      ...result,
      file: stagedFiles[index].file,
      options,
    })));
        onSuccess(); 
        return 'Processing complete!';
      },
      error: (err) => {
        const message = err.response?.data?.detail || 'An error occurred during processing.';
        setError(message);
        return message;
      },
    });

    await processPromise.catch(err => console.error(err)).finally(() => {
        setIsProcessing(false);
    });
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAddFile(file);
    e.target.value = ''; 
  };
  
  const handleOptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOptions(prev => ({ ...prev, [e.target.id]: e.target.checked }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const csvFile = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.csv'));
    if (csvFile) {
      handleAddFile(csvFile);
    } else {
      setError("Please upload a CSV file");
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload /> Upload CSV File</CardTitle>
          <CardDescription>Upload files and configure processing options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Drag and drop your CSV file here</h3>
            <p className="text-muted-foreground mb-4">or click to browse files</p>
            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" ref={fileInputRef} id="file-upload" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </div>
          {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="mt-4 space-y-2">
            {stagedFiles.map((stagedFile, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{stagedFile.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {stagedFile.rowCount.toLocaleString()} rows &times; {stagedFile.columnCount} columns
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(stagedFile.file.name)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Processing Options</CardTitle>
          <CardDescription>Configure how your data should be cleaned</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2"><input type="checkbox" id="removeDuplicates" checked={options.removeDuplicates} onChange={handleOptionChange} /><label htmlFor="removeDuplicates">Remove duplicates</label></div>
            <div className="flex items-center space-x-2"><input type="checkbox" id="handleMissing" checked={options.handleMissing} onChange={handleOptionChange} /><label htmlFor="handleMissing">Handle missing values</label></div>
            <div className="flex items-center space-x-2"><input type="checkbox" id="detectOutliers" checked={options.detectOutliers} onChange={handleOptionChange} /><label htmlFor="detectOutliers">Detect outliers</label></div>
            <div className="flex items-center space-x-2"><input type="checkbox" id="standardizeData" checked={options.standardizeData} onChange={handleOptionChange} /><label htmlFor="standardizeData">Standardize data</label></div>
          </div>
          <Button onClick={handleProcessFiles} disabled={stagedFiles.length === 0 || isProcessing} className="w-full mt-4">
            {isProcessing ? "Processing..." : `Process ${stagedFiles.length} File(s)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}