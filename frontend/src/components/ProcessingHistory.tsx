import { useState, useEffect } from "react";
import { api } from '@/lib/api';
import { Calendar, Download, Eye, Trash2, FileSpreadsheet, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface ProcessingRecord {
  id: number;
  filename: string;
  upload_date: string;
  status: "completed" | "processing" | "failed";
  summary: {
    original_rows: number;
    cleaned_rows: number;
    processing_time_seconds: number;
  };
}

export function ProcessingHistory() {
  const [historyData, setHistoryData] = useState<ProcessingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("You are not logged in. Please log in to view history.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get('/api/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHistoryData(response.data);
      } catch (err) {
        setError("Failed to fetch processing history.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredData = historyData.filter(record => {
    const matchesSearch = record.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case "failed":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <p>Loading history...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }
  const handleDownload = async (record: ProcessingRecord) => {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    const options = {
      removeDuplicates: true,
      handleMissing: true,
      detectOutliers: true,
      standardizeData: true,
    };
    const dummy = new File(["placeholder"], record.filename);

    formData.append("file", dummy);
    formData.append("options", JSON.stringify(options));

    try {
      const response = await api.post('/api/download/csv', formData, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cleaned_${record.filename}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Download failed.");
    }
  };

  const handleDelete = async (recordId: number) => {
    const token = localStorage.getItem('authToken');
    try {
      await api.delete(`/api/history/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoryData(prev => prev.filter(r => r.id !== recordId));
    } catch (error) {
      alert("Failed to delete record.");
    }
  };


  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-primary">{historyData.filter(r => r.status === "completed").length}</div><div className="text-sm text-muted-foreground">Completed</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{historyData.filter(r => r.status === "processing").length}</div><div className="text-sm text-muted-foreground">Processing</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-orange-600">{historyData.reduce((sum, r) => sum + r.summary.original_rows, 0).toLocaleString()}</div><div className="text-sm text-muted-foreground">Total Rows Processed</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{historyData.reduce((sum, r) => sum + r.summary.cleaned_rows, 0).toLocaleString()}</div><div className="text-sm text-muted-foreground">Cleaned Rows</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Processing History</CardTitle>
          <CardDescription>View and manage your data processing history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input placeholder="Search by filename..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell><div className="flex items-center gap-2">{getStatusIcon(record.status)}<span className="font-medium">{record.filename}</span></div></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(record.upload_date).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell><div className="text-sm"><div>{record.summary.original_rows} → {record.summary.cleaned_rows}</div></div></TableCell>
                    <TableCell className="text-muted-foreground">{record.summary.processing_time_seconds}s</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(record)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this record?")) {
                              handleDelete(record.id);
                            }
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Records Found</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}