import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, CheckCircle2, AlertTriangle, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from '@/lib/api';

interface DataPreviewProps {
  processedData: any[]; 
  originalFiles: File[];
}

export function DataPreview({ processedData,originalFiles }: DataPreviewProps) {
  if (!processedData || processedData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Eye className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Data to Preview</h3>
          <p className="text-muted-foreground">Process a file on the "Upload & Process" tab to see the results here.</p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = async (filename: string, file: File, options: any) => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append("file", file);
  formData.append("options", JSON.stringify(options));

  try {
    const response = await api.post('/api/download/csv', formData, {
      responseType: 'blob',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cleaned_${filename}`);
    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (error) {
    alert("Download failed.");
  }
};

  return (
    <div className="space-y-8">
      {processedData.map((result, index) => {
        const { 
          data_preview = [], 
          statistics = { numerical: {}, categorical: {} }, 
          ...summary 
        } = result;

        const headers = data_preview.length > 0 ? Object.keys(data_preview[0]) : [];

        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Results for: {summary.filename}</CardTitle>
              <CardDescription>
                Preview your cleaned and transformed data below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList>
                  <TabsTrigger value="preview">Data Preview</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                  <TabsTrigger value="quality">Data Quality</TabsTrigger>
                </TabsList>

                {/*DATA PREVIEW TAB*/}
                <TabsContent value="preview" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader><TableRow>{headers.map(h => <TableHead key={h} className="capitalize">{h.replace(/_/g, ' ')}</TableHead>)}</TableRow></TableHeader>
                      <TableBody>
                        {data_preview.map((row: any, i: number) => (
                          <TableRow key={i}>{headers.map(h => <TableCell key={h}>{String(row[h])}</TableCell>)}</TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first {data_preview.length} of {summary.cleaned_rows} cleaned rows
                  </p>
                </TabsContent>

                {/*STATISTICS TAB*/}
                <TabsContent value="statistics" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader><CardTitle className="text-base">Numerical Columns</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {Object.keys(statistics.numerical || {}).length > 0 ? Object.keys(statistics.numerical).map(col => (
                          <div key={col} className="text-sm">
                            <p className="font-semibold mb-1">{col}</p>
                            <div className="flex justify-between"><span className="text-muted-foreground">Mean:</span><span>{statistics.numerical[col].mean.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Std Dev:</span><span>{statistics.numerical[col].std.toFixed(2)}</span></div>
                          </div>
                        )) : <p className="text-sm text-muted-foreground">No numerical data found.</p>}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Categorical Columns</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {Object.keys(statistics.categorical || {}).length > 0 ? Object.keys(statistics.categorical).map(col => (
                          <div key={col} className="text-sm">
                            <p className="font-semibold mb-1">{col}</p>
                            <div className="flex justify-between"><span className="text-muted-foreground">Unique Values:</span><span>{statistics.categorical[col].unique}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Top Value:</span><span>{statistics.categorical[col].top}</span></div>
                          </div>
                        )) : <p className="text-sm text-muted-foreground">No categorical data found.</p>}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/*DATA QUALITY TAB*/}
                <TabsContent value="quality" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-sm text-green-800">{summary.duplicates_removed ?? 0} duplicates removed.</span></div>
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-sm text-green-800">{summary.missing_value_rows_removed ?? 0} rows with missing values removed.</span></div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${summary.outliers_removed > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                      {summary.outliers_removed > 0 ? <AlertTriangle className="h-4 w-4 text-orange-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      <span className={`text-sm ${summary.outliers_removed > 0 ? 'text-orange-800' : 'text-green-800'}`}>{summary.outliers_removed ?? 0} potential outliers removed.</span>
                    </div>
                    {summary.operations_performed?.includes("Standardized Data") && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"><TrendingUp className="h-4 w-4 text-green-600" /><span className="text-sm text-green-800">Numerical data was standardized.</span></div>}
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex gap-2 mt-6">
                <Button onClick={() => handleDownload(summary.filename, result.file, result.options)}>
  <Download className="h-4 w-4 mr-2" />
  Download Cleaned Data
</Button>
              </div>
            </CardContent>
          </Card> 
        )
      })}
    </div>
  );
}