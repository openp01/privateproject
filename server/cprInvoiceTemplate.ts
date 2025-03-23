import PDFDocument from 'pdfkit';
import { Readable, PassThrough } from 'stream';
import { InvoiceWithDetails, Signature } from '@shared/schema';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formatte une date au format français
 * @param dateString Date à formater
 * @returns Date formatée
 */
const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  } catch (err) {
    return dateString;
  }
};

/**
 * Formatte un montant en euros
 * @param amount Montant à formater
 * @returns Montant formaté
 */
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
};

/**
 * Formate le statut d'une facture en français
 * @param status Statut de la facture
 * @returns Statut formaté
 */
export function formatInvoiceStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'payée':
      return 'Payée';
    case 'cancelled':
    case 'annulée':
      return 'Annulée';
    case 'pending':
    case 'en attente':
    default:
      return 'En attente';
  }
}

/**
 * Génère un PDF pour une facture selon le template officiel du Cabinet Paramédical de la Renaissance
 * @param invoice Facture avec les détails (patient, thérapeute, rendez-vous)
 * @param adminSignature Signature administrative (optionnel)
 * @returns Stream du PDF généré
 */
export function generateInvoicePDF(
  invoice: InvoiceWithDetails, 
  adminSignature?: Signature | undefined
): PassThrough {
  // Créer un nouveau document PDF
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true,
    info: {
      Title: `Facture ${invoice.invoiceNumber}`,
      Author: 'Cabinet Paramédical de la Renaissance',
      Subject: `Facture pour ${invoice.patientName}`,
      Keywords: 'facture, santé, soins'
    }
  });
  
  // Utiliser PassThrough au lieu de Readable direct
  const stream = new PassThrough();
  
  // Pipe le PDF dans le stream
  doc.pipe(stream);
  
  // Définir constantes
  const pageWidth = doc.page.width - 100; // Marge de 50 de chaque côté
  const primaryColor = '#3fb549'; // Vert principal
  const darkGreen = '#266d2c'; // Vert foncé
  const headerGreen = '#266d2c'; // Vert moyen pour l'en-tête (comme dans la capture d'écran)
  
  // ==== EN-TÊTE ====
  // Bande verte supérieure
  doc.rect(0, 0, doc.page.width, 110).fill(headerGreen);
  
  // Informations de contact à gauche
  doc.font('Helvetica').fontSize(10).fillColor('white');
  doc.text('Mail: contact@cabinet-renaissance.com', 50, 20);
  doc.text('Tél: +221 33 824 35 50', 50, 35);
  doc.text('Immeuble SAWA', 50, 50);
  doc.text('Bloc B - Étage 2', 50, 65);
  doc.text('1763 Avenue Cheikh A. DIOP', 50, 80);
  doc.text('DAKAR', 50, 95);
  
  // Logo à droite - Utilisation d'une image avec taille réduite
  try {
    // Ajout du logo avec fond vert à partir du fichier
    // Réduire la taille du logo et l'aligner correctement pour qu'il ne déborde pas
    doc.image('public/logos/renaissance-logo-rev.jpg', doc.page.width - 180, 10, { 
      width: 100, // Taille réduite
      align: 'right'
    });
  } catch (error) {
    console.error("Erreur lors du chargement du logo:", error);
    // Fallback au texte en cas d'erreur
    doc.fontSize(18).fillColor('white');
    doc.text('La Renaissance', doc.page.width - 200, 40);
    doc.fontSize(10);
    doc.text('CABINET PARAMÉDICAL', doc.page.width - 200, 65);
  }
  
  // ==== SECTION NUMÉRO DE FACTURE ====
  doc.fillColor('black');
  doc.moveDown(4);
  doc.fontSize(14).font('Helvetica-Bold').text(`FACTURE N° ${invoice.invoiceNumber}`, { align: 'center' });
  
  // ==== SECTION STATUT ET DATE ====
  doc.moveDown(1);
  // Statut
  doc.fontSize(12).fillColor(primaryColor).font('Helvetica-Bold')
    .text('STATUT:', 50, 150);
  doc.fillColor('black').font('Helvetica')
    .text(formatInvoiceStatus(invoice.status), 120, 150);
    
  // Date d'émission  
  doc.fillColor(primaryColor).font('Helvetica-Bold')
    .text('Date d\'émission:', 50, 170);
  doc.fillColor('black').font('Helvetica')
    .text(formatDate(invoice.issueDate), 150, 170);
  
  // ==== SECTION THÉRAPEUTE ET PATIENT ====
  // Afficher le nom du thérapeute à gauche
  doc.fontSize(12).font('Helvetica-Bold')
    .text('THERAPEUTE', 50, 210);
  doc.fontSize(10).font('Helvetica')
    .text(invoice.therapistName, 50, 230);
  
  // Afficher le nom du patient à droite
  doc.fontSize(12).font('Helvetica-Bold')
    .text('PATIENT(E)', 400, 210);
  doc.fontSize(10).font('Helvetica')
    .text(invoice.patientName, 400, 230);
  
  // ==== SECTION OBJET ====
  doc.moveDown(4);
  doc.fontSize(10).font('Helvetica-Bold')
    .text('OBJET:', 50, 270);
  doc.font('Helvetica')
    .text('Facture relative aux prestations paramédicales réalisées par le Cabinet Paramédical de la Renaissance pour la période concernée.Nous restons à votre disposition pour toute information complémentaire.', 
      50, 290, { width: pageWidth });
  doc.text('', 
    50, 320, { width: pageWidth });
  
  // Ligne horizontale
  doc.moveTo(50, 350).lineTo(doc.page.width - 50, 350).stroke();
  
  // ==== SECTION PÉRIODE CONCERNÉE ====
  doc.fontSize(12).font('Helvetica-Bold')
    .text('DATE(S) OU PERIODE CONCERNEE', { align: 'center' });
  
  doc.moveDown(1.5);
  
  // Préparer les dates à afficher
  let dates: string[] = [];
  let isMultipleAppointments = false;
  
  // Déterminer quelles dates afficher
  if (invoice.appointmentDates && invoice.appointmentDates.length > 0) {
    // Utiliser directement les dates fournies dans le champ appointmentDates
    // Mais supprimer l'heure pour gagner de l'espace
    dates = [...invoice.appointmentDates].map(dateTime => {
      // Si la date contient "à" (séparateur d'heure), ne garder que la partie date
      if (dateTime.includes(' à ')) {
        return dateTime.split(' à ')[0];
      }
      return dateTime;
    });
    isMultipleAppointments = dates.length > 1;
  } else {
    // Cas standard d'un seul rendez-vous - même ici on ne garde que la date
    dates.push(formatDate(invoice.appointmentDate));
    isMultipleAppointments = false;
  }
  
  // Trier les dates chronologiquement si possible
  try {
    dates.sort((a, b) => {
      // Essayer d'extraire et de comparer les dates
      const aDatePart = a.split(' à ')[0];
      const bDatePart = b.split(' à ')[0];
      
      // Format français: convertir "12 mars 2025" en Date
      const parseDate = (dateStr: string) => {
        const months = {
          "janvier": 0, "février": 1, "mars": 2, "avril": 3, "mai": 4, "juin": 5,
          "juillet": 6, "août": 7, "septembre": 8, "octobre": 9, "novembre": 10, "décembre": 11
        };
        
        const parts = dateStr.split(' ');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = months[parts[1] as keyof typeof months];
          const year = parseInt(parts[2]);
          
          if (!isNaN(day) && month !== undefined && !isNaN(year)) {
            return new Date(year, month, day);
          }
        }
        return new Date(0); // date invalide en cas d'erreur
      };
      
      const dateA = parseDate(aDatePart);
      const dateB = parseDate(bDatePart);
      
      return dateA.getTime() - dateB.getTime();
    });
  } catch (e) {
    console.error("Erreur lors du tri des dates:", e);
    // Ignorer les erreurs de tri, garder l'ordre original
  }
  
  // Afficher les dates selon qu'il s'agit d'un rendez-vous unique ou multiple
  if (isMultipleAppointments) {
    // SÉANCES MULTIPLES
    doc.fontSize(12).font('Helvetica-Bold')
      .text(`SÉANCES MULTIPLES (${dates.length})`, { align: 'center' });
    
    doc.moveDown(1.5); // Encore plus d'espace
    
    // Équilibre optimal entre espace et lisibilité
    // Utiliser 2 colonnes au lieu de 3 pour maximiser l'espacement horizontal
    const datesPerColumn = Math.ceil(dates.length / 2);
    const col1Dates = dates.slice(0, datesPerColumn);
    const col2Dates = dates.slice(datesPerColumn);
    
    // Position de départ pour les colonnes - grand espacement entre les colonnes
    const col1X = 100; // Encore plus d'espace à gauche
    const col2X = 370; // Beaucoup plus d'espace entre colonnes
    let currentY = doc.y;
    
    // Police encore plus grande pour une meilleure lisibilité
    const fontSize = 10;
    
    // Espacement très généreux entre les lignes
    const lineSpacing = 20;
    
    // Tracer les lignes une par une pour les 2 colonnes
    const maxLines = Math.max(col1Dates.length, col2Dates.length);
    
    for (let i = 0; i < maxLines; i++) {
      if (i < col1Dates.length) {
        doc.fontSize(fontSize).font('Helvetica')
          .text(`• ${col1Dates[i]}`, col1X, currentY, { width: 240 });
      }
      
      if (i < col2Dates.length) {
        doc.fontSize(fontSize).font('Helvetica')
          .text(`• ${col2Dates[i]}`, col2X, currentY, { width: 240 });
      }
      
      currentY += lineSpacing;
    }
    
    // Mettre à jour la position Y du document et ajouter de l'espace
    doc.y = currentY + 10;
  } else {
    // Cas standard d'un seul rendez-vous - sans afficher l'heure
    doc.fontSize(9).font('Helvetica')
      .text(formatDate(invoice.appointmentDate), { align: 'center' });
  }
  
  // Ligne horizontale - avec plus d'espace
  doc.moveDown(1.0);
  const lineY = doc.y + 5;
  doc.moveTo(50, lineY).lineTo(doc.page.width - 50, lineY).stroke();
  
  // ==== TABLEAU DES ACTES ====
  doc.moveDown(2.0); // Encore plus d'espace avant le tableau
  // En-têtes des colonnes
  doc.fontSize(10).font('Helvetica-Bold'); // Police légèrement plus grande
  doc.text('NATURE DES ACTES', 70, doc.y);
  doc.text('NOMBRE D\'ACTES', 300, doc.y - 12);
  doc.text('TARIF UNITAIRE', 450, doc.y - 12);
  
  // Ligne après les en-têtes
  doc.moveDown(0.5); // Plus d'espace après les en-têtes
  const headerLineY = doc.y + 5;
  doc.moveTo(50, headerLineY).lineTo(doc.page.width - 50, headerLineY).stroke();
  
  // Contenu de la ligne principale (séance)
  doc.moveDown(1.2); // Plus d'espace pour le contenu
  doc.fontSize(10).font('Helvetica'); // Police légèrement plus grande
  
  // Déterminer le texte descriptif et le nombre de séances
  let descriptionText = 'Séance d\'orthophonie';
  let sessionCount = '1';
  
  // Si c'est une facture pour rendez-vous récurrents ou groupés
  if (isMultipleAppointments) {
    descriptionText = 'Séances d\'orthophonie';
    sessionCount = dates.length.toString();
  }
  
  doc.text(descriptionText, 70, doc.y);
  doc.text(sessionCount, 340, doc.y - 12);
  doc.text(formatCurrency(50), 460, doc.y - 12); // Prix unitaire fixe de 50€
  
  // Ligne pour les notes
  doc.moveDown(1.5); // Plus d'espace
  const notesLineY = doc.y + 5;
  doc.moveTo(50, notesLineY).lineTo(doc.page.width - 50, notesLineY).stroke();
  
  // Notes complémentaires si présentes
  if (invoice.notes) {
    doc.moveDown(0.8); // Plus d'espace avant les notes
    
    // Traiter simplement les notes comme elles sont, sans filtrage spécial pour les factures récurrentes
    // Ce comportement correspond à celui des factures à séance unique
    let displayNotes = invoice.notes;
    
    // Afficher les notes avec une taille de police plus lisible
    doc.fontSize(10).font('Helvetica-Bold')
      .text('NOTE(S):', 70);
    doc.fontSize(9).font('Helvetica') // Police plus grande pour les notes
      .text(displayNotes, 70, doc.y + 5, { width: pageWidth - 140 });
  } else {
    doc.moveDown(0.8); // Plus d'espace même quand il n'y a pas de notes
  }
  
  // Ligne avant le total
  doc.moveDown(0.3); // Réduit encore plus l'espacement
  const totalLineY = doc.y + 5;
  doc.moveTo(50, totalLineY).lineTo(doc.page.width - 50, totalLineY).stroke();
  
  // ==== SECTION TOTAL ====
  doc.moveDown(0.5); // Réduit l'espacement pour optimiser la place
  doc.fontSize(11).font('Helvetica-Bold') // Police légèrement plus petite
    .fillColor(primaryColor)
    .text('TOTAL:', 70);
  doc.fillColor('black')
    .text(formatCurrency(invoice.totalAmount), 130, doc.y - 12);
  
  // ==== SECTION ATTENTION ====
  // Déterminer l'espacement en fonction du nombre de dates
  const hasManyDates = dates.length > 8;
  
  // Plus d'espace avant la section d'attention
  doc.moveDown(hasManyDates ? 0.7 : 1.0);
  
  // Format plus lisible avec une police légèrement plus grande
  doc.fontSize(9).font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('ATTENTION:', 70);
    
  doc.fillColor('black').font('Helvetica')
    .text('• Tout rendez-vous non annulé ou annulé moins de 24h à l\'avance est dû.', 90, doc.y + 5);
  doc.moveDown(0.5); // Plus d'espace entre les points
  doc.text('• Après trois paiements non réalisés ou en retard, le cabinet se réserve le droit d\'interrompre le suivi.', 90);
  
  doc.moveDown(0.5); // Plus d'espace avant le message de remerciement
  doc.text('Merci de votre compréhension', { align: 'center' });
  
  // ==== SIGNATURE ====
  // Signature électronique si disponible
  if (adminSignature?.signatureData) {
    // Ajouter la signature (plus petite et plus proche du texte)
    doc.image(Buffer.from(adminSignature.signatureData.replace(/^data:image\/\w+;base64,/, ''), 'base64'), 
      doc.page.width - 170, doc.y + 10, { width: 100 });
      
    // Tampon "PAYÉ" si la facture est marquée comme payée et qu'un tampon est disponible (plus petit)
    if (invoice.status.toLowerCase() === 'payée' && adminSignature.paidStampData) {
      doc.image(Buffer.from(adminSignature.paidStampData.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
        100, doc.y + 10, { width: 100 });
    }
  }
  
  // ==== PIED DE PAGE ====
  // Position Y pour le pied de page (plus haut dans la page)
  const footerY = doc.page.height - 30;
  
  // Ligne horizontale pour séparer le pied de page
  doc.moveTo(50, footerY - 5).lineTo(doc.page.width - 50, footerY - 5).stroke();
  
  // Informations légales (police plus petite)
  doc.fontSize(7).text(
    'Cabinet paramédical de la renaissance SUARL - NINEA : 007795305 - Registre de Commerce : SN DKR 2020 B5204 - TVA non applicable',
    20, footerY, { align: 'center', width: pageWidth }
  );
  
  // Finaliser le document
  doc.end();
  
  return stream;
}