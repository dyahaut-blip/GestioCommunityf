
import React, { useState } from 'react';
import { PageProps } from '../types';
import { Modal } from '../components/Modal';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

interface DeletedItem {
  id: string;
  name: string;
  zone: string;
  deletedBy: string;
  date: string;
}

const initialItems: DeletedItem[] = [
  { id: '1', name: 'Jean-Marc Yace', zone: 'MUNICIPAL', deletedBy: 'Admin', date: '01/12/2025' }
];

export const RecycleBin: React.FC<PageProps> = ({ notify }) => {
  const [items, setItems] = useState<DeletedItem[]>(initialItems);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newZone, setNewZone] = useState('Nord');

  const handleRestore = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    notify('Élément restauré avec succès', 'success');
  };

  const handleDeleteForever = (id: string) => {
    if (confirm('Cette action est irréversible. Continuer ?')) {
      setItems(items.filter(i => i.id !== id));
      notify('Élément supprimé définitivement', 'error');
    }
  };

  const openReassignModal = (id: string) => {
    setSelectedItemId(id);
    setNewZone('Nord'); // Default value
    setIsReassignModalOpen(true);
  };

  const handleReassign = () => {
    if (selectedItemId) {
      setItems(items.filter(i => i.id !== selectedItemId));
      notify(`Membre réaffecté à la zone ${newZone} et restauré`, 'success');
      setIsReassignModalOpen(false);
      setSelectedItemId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden mb-6 gap-4">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-bold">Corbeille</h1>
          <p className="text-blue-100 text-sm mt-1">Restaurer ou supprimer définitivement les éléments.</p>
        </div>
        <div className="relative z-10 mt-2 md:mt-0 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-white/90">Les éléments sont supprimés définitivement après 30 jours</span>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col overflow-hidden">
         <div className="overflow-x-auto">
           <div className="grid grid-cols-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[600px]">
             <div>Membre Supprimé</div>
             <div>Zone</div>
             <div>Supprimé par</div>
             <div className="text-right">Actions</div>
           </div>
           
           {items.length > 0 ? (
             <div className="divide-y divide-gray-100 min-w-[600px]">
               {items.map(item => (
                 <div key={item.id} className="grid grid-cols-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-gray-500 text-sm">{item.zone}</div>
                    <div className="text-gray-500 text-sm">
                      {item.deletedBy} <br/>
                      <span className="text-xs text-gray-400">{item.date}</span>
                    </div>
                    <div className="text-right flex justify-end gap-2 items-center">
                      <button onClick={() => handleRestore(item.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition">
                        Restaurer
                      </button>
                      <button onClick={() => openReassignModal(item.id)} className="text-amber-600 hover:text-amber-800 text-sm font-medium px-3 py-1 rounded hover:bg-amber-50 transition">
                        Réaffecter
                      </button>
                      <div className="h-4 w-px bg-gray-200 mx-1"></div>
                      <button onClick={() => handleDeleteForever(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition" title="Supprimer définitivement">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-8 min-w-full">
                <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <p className="text-gray-500">La corbeille est vide</p>
             </div>
           )}
         </div>
      </div>

      {/* Reassign Modal */}
      <Modal 
        isOpen={isReassignModalOpen} 
        onClose={() => setIsReassignModalOpen(false)} 
        title="Réaffecter le membre"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Sélectionnez la nouvelle zone pour ce membre. Le membre sera restauré et affecté à cette zone.
          </p>
          
          <Select 
            label="Nouvelle Zone"
            options={['Nord', 'Sud', 'Est', 'Ouest', 'Centre']}
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsReassignModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleReassign}>
              Confirmer la réaffectation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
