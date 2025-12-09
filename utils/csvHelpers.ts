
// Convertit un tableau d'objets en chaîne CSV et déclenche le téléchargement
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;

  const separator = ';'; // Préférence point-virgule pour Excel version française
  const keys = Object.keys(data[0]);
  
  // Ajout du BOM \uFEFF pour que Excel reconnaisse l'encodage UTF-8 correctement
  const csvContent =
    '\uFEFF' + 
    keys.join(separator) +
    '\n' +
    data
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            // Echapper les guillemets doubles
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
            // Si la cellule contient le séparateur, des retours à la ligne ou des guillemets, on l'encadre de guillemets
            if (cell.search(new RegExp(`("|${separator}|\n)`, 'g')) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Lit un fichier CSV et retourne un tableau d'objets JSON
export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      let text = e.target?.result as string;
      if (!text) {
        resolve([]);
        return;
      }

      // NETTOYAGE CRITIQUE : Enlever le BOM (Byte Order Mark) si présent au début du fichier
      // Sinon la première colonne "Zone" devient "\uFEFFZone" et n'est pas reconnue
      text = text.replace(/^\uFEFF/, '');

      // Gérer les différents types de retours à la ligne (Windows \r\n, Unix \n)
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) {
          resolve([]);
          return;
      }

      // Détecter le séparateur (virgule ou point-virgule) basé sur la première ligne
      const firstLine = lines[0];
      const separator = firstLine.includes(';') ? ';' : ',';

      // Nettoyer les en-têtes (trim et enlever les guillemets)
      const headers = firstLine.split(separator).map((h) => h.trim().replace(/^"|"$/g, ''));
      
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(separator); 
        
        // Si la ligne est vide ou n'a pas le bon nombre de colonnes (optionnel), on peut skip
        if (currentline.length < 1) continue;

        const obj: any = {};

        for (let j = 0; j < headers.length; j++) {
          const val = currentline[j] ? currentline[j].trim().replace(/^"|"$/g, '') : '';
          // Ne garder que les colonnes qui ont un header
          if (headers[j]) {
             obj[headers[j]] = val;
          }
        }
        // On n'ajoute la ligne que si elle contient au moins une donnée
        if (Object.keys(obj).length > 0) {
           result.push(obj);
        }
      }
      resolve(result);
    };

    reader.onerror = () => {
        // Renvoie une erreur explicite au lieu de l'objet événement générique
        reject(new Error("Erreur lors de la lecture du fichier : " + (reader.error?.message || "Erreur inconnue")));
    };
    
    reader.readAsText(file); // Lecture en UTF-8 par défaut
  });
};
