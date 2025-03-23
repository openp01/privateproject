/**
 * Service d'upload de fichiers local
 * 
 * Cette implémentation utilise l'objet URL.createObjectURL pour créer une URL locale
 * qui pointe vers le fichier, ce qui fonctionne dans le navigateur sans serveur.
 */

// Stockage des blobs pour les conserver en mémoire
const blobStorage: { [url: string]: Blob } = {};

/**
 * Crée une URL locale pour un fichier
 * @param file Fichier à télécharger
 * @param prefix Préfixe pour identifiant (par défaut: 'receipts')
 * @returns URL locale du fichier
 */
export async function uploadFile(file: File, prefix: string = 'receipts'): Promise<string> {
  // Simuler un délai pour donner l'impression d'un téléchargement
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Créer un blob URL pour le fichier
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const blobUrl = URL.createObjectURL(blob);
  
  // Stocke le blob pour éviter qu'il ne soit garbage collected
  blobStorage[blobUrl] = blob;
  
  // Enregistre le nom de fichier pour pouvoir le retrouver
  registerFileName(blobUrl, file.name);
  
  console.log(`Fichier téléchargé localement: ${blobUrl}, nom: ${file.name}`);
  
  return blobUrl;
}

/**
 * Supprime un fichier stocké et nettoie les ressources
 * @param fileUrl URL du fichier à supprimer
 * @returns true si la suppression a réussi
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  // Simuler un délai pour la suppression
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (fileUrl.startsWith('blob:')) {
    try {
      // Libérer la mémoire du blob
      if (blobStorage[fileUrl]) {
        URL.revokeObjectURL(fileUrl);
        delete blobStorage[fileUrl];
      }
      
      // Supprimer le nom de fichier enregistré
      if (fileNames[fileUrl]) {
        delete fileNames[fileUrl];
      }
      
      console.log(`Fichier supprimé: ${fileUrl}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  }
  
  console.log(`Fichier supprimé (simulé): ${fileUrl}`);
  return true;
}

// Stocker les noms de fichiers originaux pour les URLs Blob
const fileNames: { [url: string]: string } = {};

/**
 * Enregistre le nom de fichier original pour une URL Blob
 * @param url URL Blob
 * @param fileName Nom du fichier original
 */
export function registerFileName(url: string, fileName: string): void {
  fileNames[url] = fileName;
}

/**
 * Extrait le nom du fichier à partir de son URL
 * @param fileUrl URL du fichier
 * @returns Nom du fichier
 */
export function getFileNameFromUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  
  // Pour les URLs Blob, utiliser le nom enregistré
  if (fileUrl.startsWith('blob:') && fileNames[fileUrl]) {
    return fileNames[fileUrl];
  }
  
  // Fallback pour les URLs traditionnelles
  const urlParts = fileUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  
  // Supprimer l'identifiant unique du nom du fichier
  const nameWithoutId = fileName.indexOf('_') > 0 
    ? fileName.substring(fileName.indexOf('_') + 1) 
    : fileName;
  
  // Remplacer les caractères spéciaux par des espaces
  return nameWithoutId.replace(/_/g, ' ');
}

/**
 * Vérifie si l'extension du fichier est une image
 * @param fileName Nom du fichier
 * @returns true si le fichier est une image
 */
export function isImageFile(fileName: string): boolean {
  if (!fileName) return false;
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
}

/**
 * Vérifie si l'extension du fichier est un PDF
 * @param fileName Nom du fichier
 * @returns true si le fichier est un PDF
 */
export function isPdfFile(fileName: string): boolean {
  if (!fileName) return false;
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension === 'pdf';
}

/**
 * Vérifie si une URL est externe (par exemple, storage.example.com)
 * @param url URL à vérifier
 * @returns True si l'URL est externe
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  
  // Si c'est une URL Blob, ce n'est pas externe
  if (url.startsWith('blob:')) {
    return false;
  }
  
  // Vérifie si l'URL contient "storage.example.com" ou d'autres domaines externes
  return url.includes('storage.example.com') || 
         url.includes('http://') || 
         url.includes('https://');
}

/**
 * Nettoie les URLs externes pour affichage dans l'interface
 * @param url URL à nettoyer
 * @returns URL nettoyée pour affichage
 */
export function getSafeDisplayUrl(url: string): string {
  if (!url) return '';
  
  // Si c'est une URL Blob, l'utiliser telle quelle
  if (url.startsWith('blob:')) {
    return url;
  }
  
  // Si c'est une URL externe, remplacer par le nom du fichier
  if (isExternalUrl(url)) {
    // Pour les fichiers externes, on n'essaie pas de les afficher directement
    // On retourne une chaîne vide pour éviter les erreurs d'affichage
    return '';
  }
  
  return url;
}

/**
 * Ouvre un PDF directement dans un nouvel onglet du navigateur
 * @param url URL du fichier PDF
 */
export function openPdfInNewTab(url: string): void {
  if (!url) return;
  
  // Si c'est déjà une URL Blob, l'ouvrir directement
  if (url.startsWith('blob:')) {
    window.open(url, '_blank');
    return;
  }
  
  // Si c'est une URL externe, ne pas essayer de l'ouvrir
  if (isExternalUrl(url)) {
    console.log('URL externe ignorée:', url);
    return;
  }
  
  // Sinon, essayer de trouver le blob correspondant et l'ouvrir
  for (const [blobUrl, filename] of Object.entries(fileNames)) {
    if (filename === getFileNameFromUrl(url)) {
      window.open(blobUrl, '_blank');
      return;
    }
  }
  
  // Fallback: ouvrir l'URL directement
  window.open(url, '_blank');
}