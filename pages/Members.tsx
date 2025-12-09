

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Member, PageProps } from '../types';
import { supabase } from '../supabaseClient'; // Import du client réel
import { exportToCSV } from '../utils/csvHelpers';

export const Members: React.FC<PageProps> = ({ notify, currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'joinDate', direction: 'desc' });
  
  // Initialize filter with user's managed zone if applicable
  const [filters, setFilters] = useState({
    status: 'Tous les statuts',
    gender: 'Tous les genres',
    zone: currentUser && currentUser.managedZone !== 'Global' ? currentUser.managedZone : 'Toutes les zones'
  });

  const isZoneLocked = currentUser && currentUser.managedZone !== 'Global';

  // Chargement réel depuis Supabase
  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error("Erreur chargement membres:", error);
      notify("Erreur lors du chargement de la liste des membres", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Detailed Add Member Form State
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'Homme',
    maritalStatus: 'Célibataire',
    role: 'Membre',
    zone: isZoneLocked ? currentUser?.managedZone : '',
    quartier: '',
    status: 'Actif',
    address: ''
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        const memberData = {
          firstName: newMember.firstName.toUpperCase(),
          lastName: newMember.lastName.toUpperCase(),
          email: newMember.email || null,
          phone: newMember.phone,
          location: newMember.quartier.toUpperCase(),
          zone: newMember.zone,
          role: newMember.role,
          status: newMember.status,
          joinDate: new Date().toISOString().split('T')[0],
          gender: newMember.gender,
          maritalStatus: newMember.maritalStatus,
          birthDate: newMember.birthDate || null,
          address: newMember.address,
          avatarColor: newMember.gender === 'Homme' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
        };

        const { error } = await supabase.from('members').insert([memberData]);

        if (error) throw error;
        
        notify(`Membre ${newMember.firstName} ajouté avec succès`, 'success');
        setIsAddModalOpen(false);
        loadMembers(); // Recharger la liste
        
        // Reset form
        setNewMember({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          birthDate: '',
          gender: 'Homme',
          maritalStatus: 'Célibataire',
          role: 'Membre',
          zone: isZoneLocked ? currentUser?.managedZone : '',
          quartier: '',
          status: 'Actif',
          address: ''
        });

    } catch (error: any) {
        console.error(error);
        notify("Erreur lors de l'ajout du membre", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      try {
          const { error } = await supabase.from('members').delete().eq('id', id);
          if (error) throw error;
          
          setMembers(members.filter(m => m.id !== id));
          if (selectedIds.has(id)) {
              const newSelected = new Set(selectedIds);
              newSelected.delete(id);
              setSelectedIds(newSelected);
          }
          notify('Membre supprimé définitivement', 'info');
      } catch (error) {
          notify("Erreur lors de la suppression", "error");
      }
    }
  };

  const handleMessage = () => {
    setIsMessageModalOpen(true);
  };

  // Sorting Handler
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Helper to render sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
        return (
            <svg className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        );
    }
    return sortConfig.direction === 'asc' ? (
        <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
        </svg>
    ) : (
        <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
    );
  };

  // Logic de filtrage et de tri
  const filteredMembers = useMemo(() => {
    // 1. Filtrage
    let result = members.filter(member => {
      const matchesSearch = (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'Tous les statuts' || member.status === filters.status;
      const matchesGender = filters.gender === 'Tous les genres' || member.gender === filters.gender;
      
      let matchesZone = true;
      if (isZoneLocked) {
          matchesZone = member.zone === currentUser?.managedZone;
      } else {
          matchesZone = filters.zone === 'Toutes les zones' || member.location === filters.zone || member.zone === filters.zone;
      }
      
      return matchesSearch && matchesStatus && matchesGender && matchesZone;
    });

    // 2. Tri
    if (sortConfig !== null) {
      result.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Specific handling for composite keys or dates
        if (sortConfig.key === 'name') {
            aValue = (a.firstName + a.lastName).toLowerCase();
            bValue = (b.firstName + b.lastName).toLowerCase();
        } else if (sortConfig.key === 'location') {
            // Sort by Zone then Location
            aValue = (a.zone + a.location).toLowerCase();
            bValue = (b.zone + b.location).toLowerCase();
        } else if (sortConfig.key === 'joinDate') {
            aValue = new Date(a.joinDate).getTime();
            bValue = new Date(b.joinDate).getTime();
        } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [members, searchTerm, filters, isZoneLocked, currentUser, sortConfig]);

  // Logic de Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredMembers.map(m => m.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Determine actual recipients based on selection vs filters
  const targetMembers = selectedIds.size > 0 
    ? members.filter(m => selectedIds.has(m.id)) 
    : filteredMembers;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMessageModalOpen(false);
    notify(`Message envoyé avec succès à ${targetMembers.length} membres.`, 'success');
    setSelectedIds(new Set()); // Reset selection after send
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      notify("Aucun membre à exporter.", "info");
      return;
    }

    const dataToExport = filteredMembers.map(m => ({
      Prénom: m.firstName,
      Nom: m.lastName,
      Email: m.email || '',
      Téléphone: m.phone,
      Genre: m.gender,
      Statut: m.status,
      Rôle: m.role,
      Zone: m.zone || '',
      Quartier: m.location,
      "Date d'adhésion": m.joinDate,
      Adresse: m.address || '',
      "État Civil": m.maritalStatus || ''
    }));

    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    exportToCSV(dataToExport, `membres_export_${dateStr}.csv`);
    notify("Export CSV téléchargé avec succès", "success");
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Chargement des membres depuis Supabase...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <div className="bg-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden mb-6 gap-4">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Gestion des membres
            {isZoneLocked && <span className="ml-2 text-sm bg-blue-500 px-2 py-0.5 rounded-lg border border-blue-400">Zone {currentUser?.managedZone}</span>}
          </h1>
          <p className="text-blue-100 text-sm mt-1 md:ml-10">Gérez la liste complète et les informations détaillées des membres.</p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-3 w-full md:w-auto mt-2 md:mt-0">
          <Button variant="secondary" onClick={handleExportCSV} className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20 shadow-sm text-sm backdrop-blur-sm flex-1 md:flex-none justify-center" title="Exporter en Excel (CSV)">
             <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
             </span>
          </Button>
          <Button variant="secondary" onClick={handleMessage} className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20 shadow-sm text-sm backdrop-blur-sm flex-1 md:flex-none justify-center">
            <span className="flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               Message {selectedIds.size > 0 && <span className="bg-white text-blue-600 px-1.5 rounded-full text-xs font-bold">{selectedIds.size}</span>}
            </span>
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="!bg-white !text-blue-600 hover:!bg-blue-50 shadow-lg text-sm font-semibold border-none whitespace-nowrap flex-1 md:flex-none justify-center">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Ajouter Membre
            </span>
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="md:col-span-1 relative">
           <input 
             type="text" 
             placeholder="Rechercher..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
           />
           <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
        >
          <option>Tous les statuts</option>
          <option>Actif</option>
          <option>Inactif</option>
        </select>
        <select 
          value={filters.gender}
          onChange={(e) => setFilters({...filters, gender: e.target.value})}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
        >
          <option>Tous les genres</option>
          <option>Homme</option>
          <option>Femme</option>
        </select>
        
        {/* Zone Filter - Locked if user has restricted scope */}
        {isZoneLocked ? (
             <div className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg text-sm flex items-center">
                 <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 Zone : {currentUser?.managedZone}
             </div>
        ) : (
            <select 
            value={filters.zone}
            onChange={(e) => setFilters({...filters, zone: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
            >
            <option>Toutes les zones</option>
            <option>KENNEDY</option>
            <option>MUNICIPAL</option>
            <option>Nord</option>
            <option>Sud</option>
            <option>Est</option>
            <option>Ouest</option>
            </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4 w-10">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      checked={filteredMembers.length > 0 && selectedIds.size === filteredMembers.length}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                
                {/* Sortable Headers */}
                <th 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group select-none"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Membre {getSortIcon('name')}
                  </div>
                </th>

                <th 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group select-none"
                  onClick={() => requestSort('phone')}
                >
                  <div className="flex items-center gap-1">
                    Contact {getSortIcon('phone')}
                  </div>
                </th>
                
                <th 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group select-none"
                  onClick={() => requestSort('location')}
                >
                  <div className="flex items-center gap-1">
                    Localisation {getSortIcon('location')}
                  </div>
                </th>

                <th 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group select-none"
                  onClick={() => requestSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Rôle {getSortIcon('role')}
                  </div>
                </th>

                <th 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group select-none"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Statut {getSortIcon('status')}
                  </div>
                </th>

                <th 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group select-none"
                  onClick={() => requestSort('joinDate')}
                >
                  <div className="flex items-center gap-1">
                    Date d'adhésion {getSortIcon('joinDate')}
                  </div>
                </th>
                
                <th className="px-6 py-4 text-right whitespace-nowrap">Actes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                <tr key={member.id} className={`hover:bg-gray-50 transition-colors group ${selectedIds.has(member.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4">
                     <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.has(member.id)}
                        onChange={() => handleSelectRow(member.id)}
                     />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelectRow(member.id)}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${member.avatarColor || 'bg-gray-100 text-gray-500'}`}>
                        {member.firstName.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 truncate max-w-[150px]">{member.firstName} {member.lastName}</div>
                        <div className="text-xs text-gray-400">
                          {member.gender} {member.maritalStatus ? `, ${member.maritalStatus}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="font-medium">{member.phone}</div>
                    {member.email && <div className="text-xs text-gray-400 truncate max-w-[150px]">{member.email}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{member.location}</div>
                    <div className="text-xs text-gray-400">{member.zone || 'ABIDJAN'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      member.status === 'Actif' ? 'bg-green-100 text-green-700' : 
                      member.status === 'Inactif' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{member.joinDate}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(member.id)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-500 transition-colors">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">Aucun membre trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter Nouveau Membre">
        <form onSubmit={handleAddMember} className="space-y-6 mt-2">
           {/* Row 1: Names */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <Input label="Prénom" value={newMember.firstName} onChange={(e) => setNewMember({...newMember, firstName: e.target.value})} required />
             <Input label="Nom" value={newMember.lastName} onChange={(e) => setNewMember({...newMember, lastName: e.target.value})} required />
           </div>
           
           {/* Row 2: Contact */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <Input label="Courriel (facultatif)" type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} />
             <Input label="Téléphone" value={newMember.phone} onChange={(e) => setNewMember({...newMember, phone: e.target.value})} required />
           </div>

           {/* Row 3: Bio Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <Input 
                label="Date de Naissance (Optionnel)" 
                type="date" 
                placeholder="jj/mm/aaaa"
                value={newMember.birthDate} 
                onChange={(e) => setNewMember({...newMember, birthDate: e.target.value})} 
             />
             <Select 
                label="Genre" 
                options={['Homme', 'Femme']} 
                value={newMember.gender} 
                onChange={(e) => setNewMember({...newMember, gender: e.target.value})} 
             />
           </div>

           {/* Row 4: Status & Role */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <Select 
                label="État civil" 
                options={['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)']} 
                value={newMember.maritalStatus} 
                onChange={(e) => setNewMember({...newMember, maritalStatus: e.target.value})} 
             />
             <Select 
                label="Rôle" 
                options={['Membre', 'Responsable', 'Pasteur', 'Nouveau']} 
                value={newMember.role} 
                onChange={(e) => setNewMember({...newMember, role: e.target.value})} 
             />
           </div>

           {/* Row 5: Location */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             {isZoneLocked ? (
                <div className="flex flex-col gap-1.5">
                   <label className="text-sm font-medium text-gray-700">Zone</label>
                   <input disabled value={currentUser?.managedZone} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
             ) : (
                <Select 
                    label="Zone" 
                    options={['Sélectionner une zone', 'Nord', 'Sud', 'Centre', 'Est', 'Ouest']} 
                    value={newMember.zone} 
                    onChange={(e) => setNewMember({...newMember, zone: e.target.value})} 
                />
             )}
             
             <Select 
                label="Quartier" 
                options={['Sélectionner un quartier', 'KENNEDY', 'MUNICIPAL', 'BELLEVILLE', 'AR FRANCE 1', 'AR FRANCE 2']} 
                value={newMember.quartier} 
                onChange={(e) => setNewMember({...newMember, quartier: e.target.value})} 
             />
           </div>

           {/* Row 6: Status */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select 
                label="Statut" 
                options={['Actif', 'Inactif', 'Suspendu']} 
                value={newMember.status} 
                onChange={(e) => setNewMember({...newMember, status: e.target.value})} 
             />
           </div>

           {/* Row 7: Address */}
           <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Adresse</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 min-h-[80px]"
                value={newMember.address}
                onChange={(e) => setNewMember({...newMember, address: e.target.value})}
              ></textarea>
           </div>
           
           <div className="pt-6 flex gap-3 border-t border-gray-100">
             <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} className="flex-1">Annuler</Button>
             <Button type="submit" className="flex-1">Enregistrer</Button>
           </div>
        </form>
      </Modal>

      <Modal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} title="Envoyer un message groupé">
        <form onSubmit={handleSendMessage} className="space-y-5 pt-2">
            
            {/* Target Audience Display */}
            <div className={`border rounded-lg p-4 flex flex-col gap-3 ${selectedIds.size > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${selectedIds.size > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                         </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className={`text-sm font-bold ${selectedIds.size > 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                            {selectedIds.size > 0 ? 'Destinataires (Sélection manuelle)' : 'Destinataires (Filtres actuels)'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                            Le message sera envoyé à <strong>{targetMembers.length}</strong> membres.
                        </p>
                        
                        {/* Avatar Preview */}
                        <div className="flex items-center -space-x-2 mt-3 overflow-hidden py-1">
                             {targetMembers.slice(0, 7).map(m => (
                                 <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 text-[10px] flex items-center justify-center font-bold text-gray-600" title={m.firstName}>
                                     {m.firstName.substring(0,2)}
                                 </div>
                             ))}
                             {targetMembers.length > 7 && (
                                 <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-[10px] flex items-center justify-center font-bold text-gray-500">
                                     +{targetMembers.length - 7}
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
                {selectedIds.size > 0 && (
                     <button type="button" onClick={() => setSelectedIds(new Set())} className="text-xs text-blue-600 hover:underline self-end">
                         Réinitialiser la sélection pour envoyer à tous
                     </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Canal</label>
                    <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Email</option>
                        <option>SMS</option>
                        <option>WhatsApp (Broadcast)</option>
                    </select>
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Priorité</label>
                    <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Normale</option>
                        <option>Haute</option>
                    </select>
                 </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Objet du message</label>
                <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: Information importante - Réunion de Dimanche" />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Contenu</label>
                <textarea 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-y" 
                    placeholder="Rédigez votre message ici..."
                ></textarea>
                <p className="text-xs text-gray-400 text-right">0 / 160 caractères (pour SMS)</p>
            </div>

            <div className="pt-4 flex gap-3 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={() => setIsMessageModalOpen(false)} className="flex-1">Annuler</Button>
                <Button type="submit" className="flex-1">Envoyer la diffusion ({targetMembers.length})</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};
