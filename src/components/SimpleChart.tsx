import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DataSet } from '@/types';

interface SimpleChartProps {
  dataSet: DataSet | null;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ dataSet }) => {
  if (!dataSet || !dataSet.data || dataSet.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  // Analyser les colonnes pour identifier les types
  const analyzeColumns = () => {
    if (!dataSet.columns || dataSet.data.length === 0) return { numeric: [], categorical: [] };
    
    const numeric: string[] = [];
    const categorical: string[] = [];
    
    dataSet.columns.forEach((col, colIndex) => {
      let hasNumbers = false;
      let hasStrings = false;
      let sampleCount = 0;
      
      // Analyser les 100 premières lignes pour déterminer le type
      for (let i = 0; i < Math.min(100, dataSet.data.length); i++) {
        const row = dataSet.data[i];
        let value;
        
        if (Array.isArray(row)) {
          value = row[colIndex];
        } else if (typeof row === 'object' && row !== null) {
          value = row[col];
        } else {
          value = row;
        }
        
        if (value !== null && value !== undefined && value !== '') {
          sampleCount++;
          const numValue = Number(value);
          if (!isNaN(numValue) && typeof value !== 'boolean') {
            hasNumbers = true;
          } else {
            hasStrings = true;
          }
        }
      }
      
      if (sampleCount > 0) {
        if (hasNumbers && !hasStrings) {
          numeric.push(col);
        } else {
          categorical.push(col);
        }
      }
    });
    
    return { numeric, categorical };
  };

  const { numeric, categorical } = analyzeColumns();
  
  // Créer des données de graphique basées sur les vraies données
  const createChartData = () => {
    if (numeric.length === 0) {
      // Si pas de colonnes numériques, créer des données d'index
      return dataSet.data.slice(0, 50).map((row, index) => ({
        index,
        count: index + 1,
        value: Math.random() * 100 + index * 2
      }));
    }
    
    if (numeric.length === 1) {
      // Une seule colonne numérique
      const numCol = numeric[0];
      const colIndex = dataSet.columns.indexOf(numCol);
      
      return dataSet.data.slice(0, 50).map((row, index) => {
        let value = 0;
        
        if (Array.isArray(row)) {
          value = Number(row[colIndex]) || 0;
        } else if (typeof row === 'object' && row !== null) {
          value = Number(row[numCol]) || 0;
        }
        
        return {
          index,
          [numCol]: value,
          count: index + 1
        };
      }).filter(item => item[numCol] !== 0 || item.count <= 10); // Garder au moins 10 points
    }
    
    if (numeric.length >= 2) {
      // Plusieurs colonnes numériques
      const col1 = numeric[0];
      const col2 = numeric[1];
      const col1Index = dataSet.columns.indexOf(col1);
      const col2Index = dataSet.columns.indexOf(col2);
      
      return dataSet.data.slice(0, 50).map((row, index) => {
        let value1 = 0;
        let value2 = 0;
        
        if (Array.isArray(row)) {
          value1 = Number(row[col1Index]) || 0;
          value2 = Number(row[col2Index]) || 0;
        } else if (typeof row === 'object' && row !== null) {
          value1 = Number(row[col1]) || 0;
          value2 = Number(row[col2]) || 0;
        }
        
        return {
          index,
          [col1]: value1,
          [col2]: value2
        };
      }).filter(item => (item[col1] !== 0 || item[col2] !== 0) || item.index <= 10);
    }
    
    return [];
  };

  const chartData = createChartData();
  
  console.log('Chart data:', chartData);
  console.log('Column analysis:', { numeric, categorical });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800">Graphique des Données</h3>
        <p className="text-sm text-blue-600">
          Données: {chartData.length} points | Colonnes numériques: {numeric.join(', ')} | 
          Colonnes catégorielles: {categorical.join(', ')}
        </p>
      </div>
      
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="index" 
              tick={{ fontSize: 12 }}
              label={{ value: 'Index', position: 'insideBottom', offset: -10 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {numeric.length === 0 ? (
              <>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Valeur simulée"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Compteur"
                />
              </>
            ) : numeric.length === 1 ? (
              <Line
                type="monotone"
                dataKey={numeric[0]}
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={numeric[0]}
              />
            ) : (
              numeric.slice(0, 3).map((col, index) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={['#8884d8', '#82ca9d', '#ffc658'][index]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={col}
                />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {numeric.length >= 2 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={numeric[0]} fill="#8884d8" name={numeric[0]} />
            <Bar dataKey={numeric[1]} fill="#82ca9d" name={numeric[1]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg text-xs">
        <h4 className="font-semibold mb-2">Analyse des données:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Colonnes numériques:</strong>
            <ul className="list-disc list-inside">
              {numeric.map(col => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Colonnes catégorielles:</strong>
            <ul className="list-disc list-inside">
              {categorical.map(col => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4">
          <strong>Données du graphique (premiers 5 éléments):</strong>
          <pre className="overflow-auto mt-2">
            {JSON.stringify(chartData.slice(0, 5), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SimpleChart; 