import { useState, useEffect } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, BarChart3, History, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadZone } from "@/components/UploadZone";
import { DataPreview } from "@/components/DataPreview";
import { ProcessingHistory } from "@/components/ProcessingHistory";
import { Toaster } from 'react-hot-toast';
import { api } from "@/lib/api";

interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]); 
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
  const navigate = useNavigate();
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [user, setUser] = useState<{ username: string } | null>(null);


   useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (token) {
      api.get('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => {

        setUser(response.data); 
      })
      .catch(error => {
        console.error("Failed to fetch user:", error);

        handleLogout();
      });
    }
  }, []);

  
 
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUploadedFiles([]);
  };


  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold">DataClean Pro</h1>
            </div>
            <CardDescription>
              Professional data cleaning and transformation platform for ML
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/signup">Create Account</Link>
            </Button>
            <div className="text-center">
              
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="bottom-right" />
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <FileSpreadsheet className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-semibold">DataClean Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{user ? user.username : 'User'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & Process
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Data Preview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <UploadZone 
              onDataProcessed={setProcessedData}
              onSuccess={() => setActiveTab('preview')}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <DataPreview 
             processedData={processedData}
             originalFiles={stagedFiles}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ProcessingHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
