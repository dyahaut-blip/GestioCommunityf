

import React, { useState, useEffect } from 'react';
import { PageProps } from '../types';
import { Button } from '../components/ui/Button';
import { exportToCSV } from '../utils/csvHelpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceRecord {
  id: string;
  name: string;
  phone: string; // Ajout du téléphone
  status: 'present' | 'absent' | 'excused' | null;
  avatarColor: string;
  gender: 'Homme' | 'Femme';
  zone: 'Nord' | 'Sud' | 'Est' | 'Ouest';
}

const initialRecords: AttendanceRecord[] = [
  { 
    id: '1', 
    name: 'EPSE DELLA MOROKRO', 
    phone: '0506713914',
    status: null, 
    avatarColor: 'bg-blue-100 text-blue-600',
    gender: 'Femme',
    zone: 'Nord'
  },
  { 
    id: '2', 
    name: 'KOFFI BOSSIFASSIE M KOUADIO', 
    phone: '0708091011',
    status: null, 
    avatarColor: 'bg-indigo-100 text-indigo-600',
    gender: 'Homme',
    zone: 'Sud'
  },
  { 
    id: '3', 
    name: 'JEAN DUPONT', 
    phone: '0102030405',
    status: null, 
    avatarColor: 'bg-green-100 text-green-600',
    gender: 'Homme',
    zone: 'Nord'
  },
  { 
    id: '4', 
    name: 'MARIE CURIE', 
    phone: '0504030201',
    status: null, 
    avatarColor: 'bg-pink-100 text-pink-600',
    gender: 'Femme',
    zone: 'Sud'
  }
];

export const Attendance: React.FC<PageProps> = ({ notify, currentUser }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'excel' | null>(null);
  
  // Determine if zone filter is locked
  const isZoneLocked = currentUser && currentUser.managedZone !== 'Global';
  
  // État pour les filtres
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    event: 'Présence Générale',
    gender: 'Tous les genres',
    zone: isZoneLocked ? currentUser.managedZone : 'Toutes les zones'
  });

  // Charger les données persistées au chargement
  useEffect(() => {
    const loadData = () => {
        const storedRecords = localStorage.getItem('attendance_records_list');
        if (storedRecords) {
            setRecords(JSON.parse(storedRecords));
        } else {
            setRecords(initialRecords);
            localStorage.setItem('attendance_records_list', JSON.stringify(initialRecords));
        }
        setLoading(false);
    };
    loadData();
  }, []);

  const saveRecords = (updatedRecords: AttendanceRecord[]) => {
      setRecords(updatedRecords);
      localStorage.setItem('attendance_records_list', JSON.stringify(updatedRecords));
  };

  const markAttendance = (id: string, status: 'present' | 'absent' | 'excused') => {
    const updatedRecords = records.map(r => r.id === id ? { ...r, status: r.status === status ? null : status } : r);
    saveRecords(updatedRecords);
  };

  const handleValidate = () => {
    const presentCount = records.filter(r => r.status === 'present').length;
    const date = filters.date;

    // Récupérer les stats existantes
    let stats: Record<string, number> = {};
    try {
        const saved = localStorage.getItem('attendance_stats');
        if (saved) stats = JSON.parse(saved);
    } catch (e) { console.error(e); }

    // Mise à jour des stats globales
    stats[date] = presentCount;
    localStorage.setItem('attendance_stats', JSON.stringify(stats));

    notify(`Liste validée pour le ${new Date(date).toLocaleDateString('fr-FR')}. ${presentCount} présents enregistrés. (Synchro Admin)`, 'success');
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Logique de filtrage
  const filteredRecords = records.filter(record => {
    const matchesGender = filters.gender === 'Tous les genres' || record.gender === filters.gender;
    
    // Apply zone filter logic
    let matchesZone = true;
    if (isZoneLocked) {
        matchesZone = record.zone === currentUser.managedZone;
    } else {
        matchesZone = filters.zone === 'Toutes les zones' || record.zone === filters.zone;
    }

    return matchesGender && matchesZone;
  });

  // Gestion réelle de l'export
  const handleExport = (format: 'pdf' | 'excel') => {
    setExportLoading(format);
    
    const zoneLabel = filters.zone === 'Toutes les zones' ? 'Global' : filters.zone;
    const genderLabel = filters.gender === 'Tous les genres' ? 'Tous' : filters.gender;
    const dateLabel = filters.date;
    const formattedDate = new Date(dateLabel).toLocaleDateString('fr-FR');

    // Préparation des données pour l'export Excel
    if (format === 'excel') {
        const dataToExport = filteredRecords.map(r => ({
           Nom: r.name,
           Telephone: r.phone,
           Zone: r.zone,
           Genre: r.gender,
           Statut: r.status === 'present' ? 'Présent' : r.status === 'absent' ? 'Absent' : r.status === 'excused' ? 'Excusé' : 'Non marqué',
           Date: dateLabel,
           Evenement: filters.event
        }));
        
        setTimeout(() => {
            const filename = `Presences_${zoneLabel}_${genderLabel}_${dateLabel}.csv`;
            exportToCSV(dataToExport, filename);
            notify(`Export CSV (Excel) téléchargé : ${filename}`, 'success');
            setExportLoading(null);
        }, 1000);
    } else {
        // Génération PDF avec jsPDF
        setTimeout(() => {
            try {
                const doc = new jsPDF();

                // En-tête
                doc.setFontSize(18);
                doc.setTextColor(41, 128, 185); // Bleu
                doc.text("Suivi des Présences", 14, 22);

                doc.setFontSize(11);
                doc.setTextColor(100);
                doc.text(`Date : ${formattedDate}`, 14, 32);
                doc.text(`Événement : ${filters.event}`, 14, 38);
                doc.text(`Zone : ${zoneLabel}`, 14, 44);
                doc.text(`Genre : ${genderLabel}`, 14, 50);

                // Tableau avec colonne Téléphone ajoutée
                const tableColumn = ["Membre", "Téléphone", "Zone", "Genre", "Statut"];
                const tableRows = filteredRecords.map(record => {
                    let statusText = 'Non marqué';
                    if (record.status === 'present') statusText = 'Présent';
                    else if (record.status === 'absent') statusText = 'Absent';
                    else if (record.status === 'excused') statusText = 'Excusé';
                    
                    return [record.name, record.phone || '-', record.zone, record.gender, statusText];
                });

                autoTable(doc, {
                    startY: 60, // Ajusté suite suppression contact header
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246] }, // Blue-500 equivalent
                    styles: { fontSize: 10 },
                    alternateRowStyles: { fillColor: [245, 247, 250] }
                });

                // Pied de page
                const pageCount = (doc as any).internal.getNumberOfPages();
                for(let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text('Généré par GestioCommunity', 14, doc.internal.pageSize.height - 10);
                    doc.text(`Page ${i} / ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
                }

                const filename = `Presences_${zoneLabel}_${genderLabel}_${dateLabel}.pdf`;
                doc.save(filename);
                notify(`Fichier PDF téléchargé : ${filename}`, 'success');
            } catch (error) {
                console.error(error);
                notify("Erreur lors de la génération du PDF", "error");
            } finally {
                setExportLoading(null);
            }
        }, 500);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement du suivi...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg flex flex-col xl:flex-row justify-between items-start xl:items-center relative overflow-hidden mb-6 gap-4">
         <div className="relative z-10">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h1 className="text-xl md:text-2xl font-bold">Suivi des Présences</h1>
            </div>
            <p className="text-blue-100 text-sm mt-1 ml-11">Gestion centralisée de la présence aux cultes, réunions et événements.</p>
         </div>

         {/* Boutons d'action (Export + Validation) */}
         <div className="relative z-10 w-full xl:w-auto mt-2 xl:mt-0 flex flex-col sm:flex-row gap-3">
             <div className="flex gap-2 w-full sm:w-auto">
                 {/* Export PDF (Real PDF) */}
                 <Button 
                    onClick={() => handleExport('pdf')}
                    disabled={!!exportLoading}
                    className="!bg-red-500 hover:!bg-red-600 text-white border-none shadow-lg flex-1 sm:flex-none justify-center"
                    title="Télécharger en PDF"
                 >
                    {exportLoading === 'pdf' ? (
                       <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                       <span className="flex items-center gap-2">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                           <span className="hidden sm:inline">Télécharger</span>
                       </span>
                    )}
                 </Button>
             </div>

             <Button onClick={handleValidate} className="!bg-white !text-blue-600 hover:!bg-blue-50 border-none shadow-lg whitespace-nowrap w-full sm:w-auto justify-center font-bold">
                <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Valider la liste
                </span>
             </Button>
         </div>

         <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <div className="relative">
            <input 
              type="date" 
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Événement (Optionnel)</label>
          <select 
            name="event"
            value={filters.event}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option>Présence Générale</option>
            <option>Culte Dimanche</option>
            <option>Réunion Prière</option>
            <option>Formation</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Genre</label>
          <select 
            name="gender"
            value={filters.gender}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option>Tous les genres</option>
            <option>Homme</option>
            <option>Femme</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Zone</label>
          {isZoneLocked ? (
             <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg flex items-center">
                 <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 Zone {currentUser.managedZone}
             </div>
          ) : (
            <select 
                name="zone"
                value={filters.zone}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
                <option>Toutes les zones</option>
                <option>Nord</option>
                <option>Sud</option>
                <option>Est</option>
                <option>Ouest</option>
            </select>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[800px]">
             <div className="col-span-8">Membre</div>
             <div className="col-span-2 text-center">Statut</div>
             <div className="col-span-2 text-right">Actes</div>
          </div>
          
          <div className="divide-y divide-gray-100 min-w-[800px]">
            {filteredRecords.length > 0 ? filteredRecords.map((record) => (
              <div key={record.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                 <div className="col-span-8 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${record.avatarColor}`}>
                      {record.name.substring(0, 2)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{record.name}</div>
                        <div className="text-xs text-gray-400">{record.zone} • {record.gender} • <span className="text-gray-500">{record.phone}</span></div>
                    </div>
                 </div>
                 <div className="col-span-2 text-center">
                    <span className={`text-sm italic font-medium ${
                        record.status === 'present' ? 'text-green-600' :
                        record.status === 'absent' ? 'text-red-500' :
                        record.status === 'excused' ? 'text-amber-500' :
                        'text-gray-300'
                    }`}>
                        {record.status === 'present' ? 'Présent' : 
                         record.status === 'absent' ? 'Absent' : 
                         record.status === 'excused' ? 'Excusé' :
                         'Non marqué'}
                    </span>
                 </div>
                 <div className="col-span-2 flex justify-end gap-2">
                    {/* Bouton Présent */}
                    <button 
                      onClick={() => markAttendance(record.id, 'present')}
                      className={`p-2 rounded-full transition-all ${
                        record.status === 'present' 
                        ? 'bg-green-100 text-green-600 ring-2 ring-green-500 ring-offset-1' 
                        : 'text-gray-300 hover:bg-green-50 hover:text-green-500'
                      }`}
                      title="Présent"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    
                    {/* Bouton Absent */}
                    <button 
                      onClick={() => markAttendance(record.id, 'absent')}
                      className={`p-2 rounded-full transition-all ${
                        record.status === 'absent' 
                        ? 'bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-1' 
                        : 'text-gray-300 hover:bg-red-50 hover:text-red-500'
                      }`}
                      title="Absent"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {/* Bouton Excusé (Remplaçant Retard) */}
                    <button 
                      onClick={() => markAttendance(record.id, 'excused')}
                      className={`p-2 rounded-full transition-all ${
                        record.status === 'excused' 
                        ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-500 ring-offset-1' 
                        : 'text-gray-300 hover:bg-amber-50 hover:text-amber-500'
                      }`}
                      title="Excusé / Justifié"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                 </div>
              </div>
            )) : (
                <div className="p-8 text-center text-gray-500">
                    Aucun membre trouvé pour ces critères.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
