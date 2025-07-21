import { useState, useEffect } from 'react';
import { DataSet, DataRow } from '@/types';

interface UploadHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  dataSet: DataSet;
  importOptions: any;
  preview: DataRow[];
  // Métadonnées personnalisées
  title?: string;
  notes?: string;
  tags?: string[];
  category?: 'personal' | 'work' | 'research' | 'other';
  isFavorite?: boolean;
  lastModified?: Date;
}

interface UseUploadHistoryReturn {
  history: UploadHistoryItem[];
  addToHistory: (item: Omit<UploadHistoryItem, 'id'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (id: string) => DataSet | null;
  updateHistoryItem: (id: string, updates: Partial<UploadHistoryItem>) => void;
  toggleFavorite: (id: string) => void;
  searchHistory: (query: string) => UploadHistoryItem[];
  filterByCategory: (category: UploadHistoryItem['category'] | 'all') => UploadHistoryItem[];
  getFavorites: () => UploadHistoryItem[];
  getHistoryStats: () => {
    totalFiles: number;
    totalSize: number;
    lastUpload: Date | null;
    favorites: number;
    categories: Record<string, number>;
    totalRows: number;
    totalColumns: number;
  };
}

const STORAGE_KEY = 'upload_history';
const MAX_HISTORY_SIZE = 20; // Nombre maximum d'éléments dans l'historique

export const useUploadHistory = (): UseUploadHistoryReturn => {
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);

  // Charger l'historique depuis le localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        // Convertir les dates string en objets Date
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          uploadDate: new Date(item.uploadDate)
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  }, []);

  // Sauvegarder l'historique dans le localStorage
  const saveHistory = (newHistory: UploadHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
  };

  // Ajouter un élément à l'historique
  const addToHistory = (item: Omit<UploadHistoryItem, 'id'>) => {
    const newItem: UploadHistoryItem = {
      ...item,
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setHistory(prevHistory => {
      const newHistory = [newItem, ...prevHistory.slice(0, MAX_HISTORY_SIZE - 1)];
      saveHistory(newHistory);
      return newHistory;
    });
  };

  // Supprimer un élément de l'historique
  const removeFromHistory = (id: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.id !== id);
      saveHistory(newHistory);
      return newHistory;
    });
  };

  // Vider l'historique
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Charger un dataset depuis l'historique
  const loadFromHistory = (id: string): DataSet | null => {
    const item = history.find(h => h.id === id);
    return item ? item.dataSet : null;
  };

  // Mettre à jour un élément de l'historique
  const updateHistoryItem = (id: string, updates: Partial<UploadHistoryItem>) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.map(item => 
        item.id === id 
          ? { 
              ...item, 
              ...updates, 
              lastModified: new Date() 
            }
          : item
      );
      saveHistory(newHistory);
      return newHistory;
    });
  };

  // Basculer le statut favori
  const toggleFavorite = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      updateHistoryItem(id, { isFavorite: !item.isFavorite });
    }
  };

  // Rechercher dans l'historique
  const searchHistory = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return history.filter(item => 
      (item.title || item.fileName).toLowerCase().includes(lowerQuery) ||
      (item.notes || '').toLowerCase().includes(lowerQuery) ||
      (item.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (item.category || '').toLowerCase().includes(lowerQuery)
    );
  };

  // Filtrer par catégorie
  const filterByCategory = (category: UploadHistoryItem['category'] | 'all') => {
    if (category === 'all') return history;
    return history.filter(item => item.category === category);
  };

  // Obtenir les favoris
  const getFavorites = () => {
    return history.filter(item => item.isFavorite);
  };

  // Obtenir les statistiques de l'historique
  const getHistoryStats = () => {
    if (history.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        lastUpload: null,
        favorites: 0,
        categories: {},
        totalRows: 0,
        totalColumns: 0
      };
    }

    const totalSize = history.reduce((sum, item) => sum + item.fileSize, 0);
    const lastUpload = history[0]?.uploadDate || null;
    const favorites = history.filter(item => item.isFavorite).length;
    
    const categories = history.reduce((acc, item) => {
      const category = item.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRows = history.reduce((sum, item) => sum + (item.dataSet.data?.length || 0), 0);
    const totalColumns = history.reduce((sum, item) => sum + (item.dataSet.columns?.length || 0), 0);

    return {
      totalFiles: history.length,
      totalSize,
      lastUpload,
      favorites,
      categories,
      totalRows,
      totalColumns
    };
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    loadFromHistory,
    updateHistoryItem,
    toggleFavorite,
    searchHistory,
    filterByCategory,
    getFavorites,
    getHistoryStats
  };
}; 