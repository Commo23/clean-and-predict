import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  CheckCircle, 
  Eye, 
  History, 
  Download,
  Settings,
  TrendingUp
} from 'lucide-react';

interface FeatureNotificationProps {
  onDismiss?: () => void;
}

const FeatureNotification: React.FC<FeatureNotificationProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher la notification après un délai
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right duration-300">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Nouvelles fonctionnalités !</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-700">
            Découvrez les améliorations apportées à l'importation et à la visualisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Aperçu des données</span>
              <Badge variant="secondary" className="text-xs">Nouveau</Badge>
            </div>
            <p className="text-xs text-blue-700 ml-6">
              Visualisez vos données avant de les utiliser avec recherche, tri et pagination
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Historique des uploads</span>
              <Badge variant="secondary" className="text-xs">Nouveau</Badge>
            </div>
            <p className="text-xs text-blue-700 ml-6">
              Accédez rapidement à vos fichiers précédemment uploadés
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Options d'importation avancées</span>
            </div>
            <p className="text-xs text-blue-700 ml-6">
              Plus de formats, encodages et options de nettoyage
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Visualisation améliorée</span>
            </div>
            <p className="text-xs text-blue-700 ml-6">
              Graphiques avec axes adaptatifs et échelles logarithmiques
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureNotification; 