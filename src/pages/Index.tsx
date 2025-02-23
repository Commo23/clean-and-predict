
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, BarChart2, Brain } from "lucide-react";
import DataUpload from '@/components/DataUpload';
import DataVisualization from '@/components/DataVisualization';
import MachineLearning from '@/components/MachineLearning';

const Index = () => {
  const [activeData, setActiveData] = useState<any>(null);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Data Management Dashboard</h1>
          <p className="text-lg text-gray-600">Upload, analyze, and predict with your data</p>
        </header>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="space-x-2">
              <Upload className="w-4 h-4" />
              <span>Data Upload</span>
            </TabsTrigger>
            <TabsTrigger value="visualization" className="space-x-2">
              <BarChart2 className="w-4 h-4" />
              <span>Visualization</span>
            </TabsTrigger>
            <TabsTrigger value="ml" className="space-x-2">
              <Brain className="w-4 h-4" />
              <span>Machine Learning</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Upload Your Data</CardTitle>
                <CardDescription>
                  Support for CSV, XLS, and TXT files. We'll help you clean and prepare your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataUpload onDataLoaded={setActiveData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualization">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Data Visualization</CardTitle>
                <CardDescription>
                  Explore your data through interactive charts and statistics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataVisualization data={activeData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ml">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Machine Learning</CardTitle>
                <CardDescription>
                  Train models to predict future values and identify patterns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MachineLearning data={activeData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
