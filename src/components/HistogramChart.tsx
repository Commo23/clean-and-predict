import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataRow } from '@/types';
import { getNumericValues } from '@/utils/typeUtils';

interface HistogramChartProps {
  data: DataRow[];
  column: string;
  title: string;
  description: string;
  colorScheme: string;
  showGrid: boolean;
  opacity: number;
  fillOpacity: number;
}

const COLOR_SCHEMES = {
  default: '#8884d8',
  ocean: '#3b82f6',
  forest: '#10b981',
  sunset: '#ef4444',
  pastel: '#a78bfa',
  monochrome: '#6b7280'
};

const HistogramChart: React.FC<HistogramChartProps> = ({ 
  data, 
  column, 
  title, 
  description, 
  colorScheme, 
  showGrid, 
  opacity, 
  fillOpacity 
}) => {
  const histogramData = useMemo(() => {
    const values = getNumericValues(data, column);
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binWidth = range / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0,
      label: `${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`
    }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });

    return bins;
  }, [data, column]);

  const maxCount = Math.max(...histogramData.map(bin => bin.count));
  const color = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default;

  if (histogramData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Aucune donnée numérique disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Badge variant="outline">Histogramme</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-64 relative">
            {/* Grille */}
            {showGrid && (
              <div className="absolute inset-0">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute border-l border-gray-200"
                    style={{
                      left: `${(i / 5) * 100}%`,
                      height: '100%'
                    }}
                  />
                ))}
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute border-t border-gray-200"
                    style={{
                      top: `${(i / 4) * 100}%`,
                      width: '100%'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Barres de l'histogramme */}
            <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
              {histogramData.map((bin, index) => (
                <div
                  key={index}
                  className="relative flex-1 mx-1"
                  style={{ height: '100%' }}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-t"
                    style={{
                      height: `${(bin.count / maxCount) * 100}%`,
                      backgroundColor: color,
                      opacity: opacity,
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-t"
                    style={{
                      background: `linear-gradient(to top, ${color}${Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}, transparent)`,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Labels des axes */}
            <div className="absolute bottom-0 left-0 right-0 h-8 flex justify-between px-4 text-xs text-muted-foreground">
              {histogramData.map((bin, index) => (
                <div key={index} className="text-center transform -rotate-45 origin-bottom-left">
                  {bin.start.toFixed(1)}
                </div>
              ))}
            </div>

            {/* Échelle Y */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-muted-foreground">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="text-right">
                  {Math.round((maxCount * (5 - i)) / 5)}
                </div>
              ))}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total:</span>
              <div className="font-medium">{histogramData.reduce((sum, bin) => sum + bin.count, 0)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Max:</span>
              <div className="font-medium">{maxCount}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Bins:</span>
              <div className="font-medium">{histogramData.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Plage:</span>
              <div className="font-medium">
                {histogramData[0]?.start.toFixed(1)} - {histogramData[histogramData.length - 1]?.end.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistogramChart; 