
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, BarChart2, Brain, Database, Settings } from "lucide-react";
import DataUpload from '@/components/DataUpload';
import EnhancedDataVisualization from '@/components/EnhancedDataVisualization';
import SimpleChart from '@/components/SimpleChart';
import DataCleaningManager from '@/components/DataCleaningManager';
import MachineLearning from '@/components/MachineLearning';
import TimeSeriesML from '@/components/TimeSeriesML';
import FeatureNotification from '@/components/FeatureNotification';
import MyDataFromHistory from '@/components/MyDataFromHistory';
import { DataSet } from '@/types';

const Index = () => {
  const [activeData, setActiveData] = useState<DataSet | null>(null);

  // Fonction pour gérer le chargement des données
  const handleDataLoaded = (data: DataSet | null) => {
    setActiveData(data);
  };

  // Fonction pour effacer les données
  const clearData = () => {
    setActiveData(null);
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <FeatureNotification />
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Data Management Dashboard</h1>
          <p className="text-lg text-gray-600">Upload, analyze, and predict with your data</p>
        </header>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="upload" className="space-x-2">
              <Upload className="w-4 h-4" />
              <span>Télécharger</span>
            </TabsTrigger>
            <TabsTrigger value="preprocess" className="space-x-2">
              <Settings className="w-4 h-4" />
              <span>Prétraiter</span>
            </TabsTrigger>
            <TabsTrigger value="visualization" className="space-x-2">
              <BarChart2 className="w-4 h-4" />
              <span>Aperçu</span>
            </TabsTrigger>
            <TabsTrigger value="ml" className="space-x-2">
              <Brain className="w-4 h-4" />
              <span>Machine Learning</span>
            </TabsTrigger>
            <TabsTrigger value="mydata" className="space-x-2">
              <Database className="w-4 h-4" />
              <span>My Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Upload Your Data
                  {activeData && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Données disponibles
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeData 
                    ? `Données "${activeData.metadata?.fileName}" chargées avec succès. Vous pouvez maintenant utiliser les onglets Visualisation et Machine Learning.`
                    : "Support for CSV, XLS, and TXT files. We'll help you clean and prepare your data."
                  }
                </CardDescription>
                {activeData && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearData}
                    >
                      Effacer les données
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <DataUpload onDataLoaded={handleDataLoaded} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preprocess">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Nettoyage et Prétraitement des Données
                  {activeData && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {activeData.data.length} lignes • {activeData.columns.length} colonnes
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeData 
                    ? `Nettoyez et préparez vos données "${activeData.metadata?.fileName}" pour l'analyse.`
                    : "Uploadez des données dans l'onglet 'Télécharger' pour commencer le nettoyage."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeData ? (
                  <DataCleaningManager 
                    dataSet={activeData} 
                    onDataCleaned={handleDataLoaded}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Aucune donnée disponible</p>
                    <p className="text-muted-foreground">
                      Uploadez un fichier dans l'onglet "Télécharger" pour commencer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualization">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Visualisation des Données
                  {activeData && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {activeData.data.length} lignes • {activeData.columns.length} colonnes
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeData 
                    ? `Explorez vos données "${activeData.metadata?.fileName}" avec des graphiques interactifs.`
                    : "Uploadez des données dans l'onglet 'Télécharger' pour commencer la visualisation."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeData ? (
                  <div className="space-y-6">
                    <SimpleChart dataSet={activeData} />
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Visualisation Avancée</h3>
                      <EnhancedDataVisualization dataSet={activeData} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Aucune donnée disponible</p>
                    <p className="text-muted-foreground">
                      Uploadez un fichier dans l'onglet "Télécharger" pour commencer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ml">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Machine Learning
                  {activeData && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {activeData.data.length} lignes • {activeData.columns.length} colonnes
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeData 
                    ? `Entraînez des modèles sur vos données "${activeData.metadata?.fileName}" pour prédire et analyser.`
                    : "Uploadez des données dans l'onglet 'Data Upload' pour commencer l'apprentissage automatique."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeData ? (
                  <Tabs defaultValue="timeseries" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="timeseries">Séries Temporelles</TabsTrigger>
                      <TabsTrigger value="classical">Machine Learning Classique</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="timeseries">
                      <TimeSeriesML dataSet={activeData} />
                    </TabsContent>
                    
                    <TabsContent value="classical">
                      <MachineLearning data={activeData.data} />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Aucune donnée disponible</p>
                    <p className="text-muted-foreground">
                      Uploadez un fichier dans l'onglet "Télécharger" pour commencer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mydata" className="space-y-4">
            <MyDataFromHistory 
              currentData={activeData} 
              onLoadDataset={handleDataLoaded} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
