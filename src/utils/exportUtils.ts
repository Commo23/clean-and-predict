import * as XLSX from 'xlsx';

// Export vers CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  // Obtenir les en-têtes depuis la première ligne
  const headers = Object.keys(data[0]);
  
  // Créer le contenu CSV
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Créer et télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export vers JSON
export const exportToJSON = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export vers Excel
export const exportToExcel = async (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  try {
    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new();
    
    // Convertir les données en feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');
    
    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Créer et télécharger le fichier
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    throw new Error('Erreur lors de l\'export Excel');
  }
};

// Fonction utilitaire pour formater les données avant export
export const formatDataForExport = (data: any[]) => {
  return data.map(row => {
    const formattedRow: any = {};
    Object.keys(row).forEach(key => {
      const value = row[key];
      // Convertir les dates en format lisible
      if (value instanceof Date) {
        formattedRow[key] = value.toLocaleDateString('fr-FR');
      } else if (typeof value === 'number') {
        // Formater les nombres avec des séparateurs de milliers
        formattedRow[key] = value.toLocaleString('fr-FR');
      } else {
        formattedRow[key] = value;
      }
    });
    return formattedRow;
  });
}; 