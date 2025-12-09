

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AppEvent, PageProps, FollowUpTask } from '../types';

export const Events: React.FC<PageProps> = ({ notify, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'birthdays' | 'meetings' | 'followup'>('followup'); // Default active tab could be changed if needed, keeping logic simple
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  
  // Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<AppEvent[]>([]);
  
  // Follow Up State
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([]);

  // Charger les données (Simuler une DB partagée via localStorage)
  useEffect(() => {
    const loadData = () => {
        const storedEvents = localStorage.getItem('events_data');
        const storedTasks = localStorage.getItem('followup_data');

        if (storedEvents) {
            setEvents(JSON.parse(storedEvents));
        } else {
            setEvents([]);
        }

        if (storedTasks) {
            setFollowUpTasks(JSON.parse(storedTasks));
        } else {
            // Initial Mock Data
            const initialTasks: FollowUpTask[] = [
                { id: '1', memberId: 'm1', memberName: 'Alice Kouassi', daysAbsent: 14, reason: 'Absent', status: 'À faire', type: 'Indéfini', date: '2025-12-08' },
                { id: '2', memberId: 'm2', memberName: 'Jean-Pierre Konan', daysAbsent: 21, reason: 'Voyage', status: 'En cours', type: 'Appel', assignedTo: 'Leader Demo', lastUpdate: 'Hier', date: '2025-12-07' },
                { id: '3', memberId: 'm3', memberName: 'Marie Ange NGuessan', daysAbsent: 7, reason: 'Malade', status: 'Terminé', type: 'Visite', assignedTo: 'Pasteur Paul', lastUpdate: '08/01/2025', date: '2025-12-05' },
            ];
            setFollowUpTasks(initialTasks);
            localStorage.setItem('followup_data', JSON.stringify(initialTasks));
        }
        setIsLoading(false);
    };
    loadData();
  }, []);

  const saveEvents = (newEvents: AppEvent[]) => {
      setEvents(newEvents);
      localStorage.setItem('events_data', JSON.stringify(newEvents));
  };

  const saveTasks = (newTasks: FollowUpTask[]) => {
      setFollowUpTasks(newTasks);
      localStorage.setItem('followup_data', JSON.stringify(newTasks));
  };

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // New State for Creating/Editing FollowUps
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [currentFollowUp, setCurrentFollowUp] = useState<Partial<FollowUpTask>>({});

  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [assigneeName, setAssigneeName] = useState('');

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Événement',
    date: '',
    time: '',
    location: '',
    description: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'image/jpeg' || file.type === 'image/png') {
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
      } else {
        notify('Format non supporté. Veuillez utiliser JPG ou PNG.', 'error');
      }
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const eventTypeMap: Record<string, 'event' | 'birthday' | 'meeting'> = {
      'Événement': 'event',
      'Anniversaire': 'birthday',
      'Réunion': 'meeting',
      'Culte': 'meeting',
      'Autres': 'event'
    };

    const event: AppEvent = {
      id: Math.random().toString(),
      title: newEvent.title,
      category: newEvent.category,
      date: newEvent.date || new Date().toISOString().split('T')[0],
      time: newEvent.time,
      location: newEvent.location,
      description: newEvent.description,
      type: eventTypeMap[newEvent.category] || 'event',
      image: selectedImage || undefined
    };
    
    const updatedEvents = [...events, event];
    saveEvents(updatedEvents);
    notify("Événement ajouté avec succès");
    setIsModalOpen(false);
    
    // Reset Form
    setNewEvent({ title: '', category: 'Événement', date: '', time: '', location: '', description: '' });
    setSelectedImage(null);
  };

  const filteredEvents = events.filter(e => {
    const isTypeMatch = 
      (activeTab === 'events' && e.type === 'event') ||
      (activeTab === 'birthdays' && e.type === 'birthday') ||
      (activeTab === 'meetings' && e.type === 'meeting');
    return isTypeMatch; 
  });

  // --- Follow Up Logic ---

  const isAdmin = currentUser?.role === 'Administrateur';

  // 1. Assign Logic (Admin)
  const handleAssignTask = () => {
    if (selectedTask && assigneeName) {
        const updatedTasks = followUpTasks.map(t => 
            t.id === selectedTask.id 
            ? { ...t, assignedTo: assigneeName, status: 'En cours', assignedBy: currentUser?.email } as FollowUpTask
            : t
        );
        saveTasks(updatedTasks);
        notify(`Tâche assignée à ${assigneeName} avec succès`, 'success');
        setIsAssignModalOpen(false);
        setAssigneeName('');
        setSelectedTask(null);
    }
  };

  const openAssignModal = (task: FollowUpTask) => {
      setSelectedTask(task);
      setIsAssignModalOpen(true);
  };

  // 2. Action Logic (Call/Visit)
  const handleAction = (taskId: string, type: 'Appel' | 'Visite') => {
      if (type === 'Appel') {
          window.location.href = 'tel:0102030405'; // Fake number for demo
      }
      
      const updatedTasks = followUpTasks.map(t => 
        t.id === taskId 
        ? { ...t, status: 'Terminé', type: type, lastUpdate: new Date().toLocaleDateString() } as FollowUpTask
        : t
      );
      saveTasks(updatedTasks);

      notify(`Action "${type}" enregistrée. Rapport envoyé à l'administration.`, 'success');
  };

  // 3. Create & Edit Logic
  const openCreateFollowUpModal = () => {
    setCurrentFollowUp({
      memberName: '',
      reason: 'Absent',
      date: new Date().toISOString().split('T')[0], // Default to today
      daysAbsent: 0,
      status: 'À faire',
      type: 'Indéfini',
      assignedTo: ''
    });
    setIsFollowUpModalOpen(true);
  };

  const openEditFollowUpModal = (task: FollowUpTask) => {
    setCurrentFollowUp({ ...task });
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedTasks;
    
    if (currentFollowUp.id) {
      // Edit existing
      updatedTasks = followUpTasks.map(t => 
        t.id === currentFollowUp.id 
        ? { ...t, ...currentFollowUp } as FollowUpTask
        : t
      );
      notify("Suivi modifié avec succès", 'success');
    } else {
      // Create new
      const newTask: FollowUpTask = {
        id: Math.random().toString(36).substr(2, 9),
        memberId: Math.random().toString(36).substr(2, 9), // Mock ID
        memberName: currentFollowUp.memberName || 'Inconnu',
        reason: currentFollowUp.reason || 'Autre',
        date: currentFollowUp.date,
        daysAbsent: currentFollowUp.daysAbsent || 0,
        status: (currentFollowUp.status as any) || 'À faire',
        type: (currentFollowUp.type as any) || 'Indéfini',
        assignedTo: currentFollowUp.assignedTo,
        lastUpdate: new Date().toLocaleDateString()
      };
      updatedTasks = [newTask, ...followUpTasks];
      notify("Nouveau suivi créé avec succès", 'success');
    }
    
    saveTasks(updatedTasks);
    setIsFollowUpModalOpen(false);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col relative">
      
      {/* Header Banner */}
      <div className="bg-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden mb-6 gap-4">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-bold">Événements et Planification</h1>
          <p className="text-blue-100 text-sm mt-1">
             {activeTab === 'followup' 
                ? "Gestion centralisée du suivi des membres."
                : "Calendrier des activités de la communauté."}
          </p>
        </div>
        
        {/* Buttons Action Area */}
        <div className="relative z-10 w-full md:w-auto flex justify-start md:justify-end gap-3">
          {/* Create Event Button (Admin only) */}
          {isAdmin && activeTab !== 'followup' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-2 border-none w-full md:w-auto justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <span>Créer Événement</span>
              </button>
          )}

          {/* Create FollowUp Button (Visible for all in FollowUp tab) */}
          {activeTab === 'followup' && (
             <button 
               onClick={openCreateFollowUpModal}
               className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold shadow-lg hover:bg-amber-600 transition-colors flex items-center gap-2 border-none w-full md:w-auto justify-center"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
               <span>Nouveau Suivi</span>
             </button>
          )}
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col items-center gap-6">
        <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 overflow-x-auto max-w-full">
          {/* Suivi Membre Tab - Moved to the left */}
          <button 
             onClick={() => setActiveTab('followup')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'followup' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
             <span className="flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
               Suivi Membre
             </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Événements
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('birthdays')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'birthdays' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>
              Anniversaires
            </span>
          </button>
          <button 
             onClick={() => setActiveTab('meetings')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'meetings' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <span className="flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               Réunions/Prières
            </span>
          </button>
        </div>

        {activeTab !== 'followup' && (
            <div className="bg-white border border-gray-200 rounded-full p-1 flex">
            <button 
                onClick={() => setTimeFilter('upcoming')}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${timeFilter === 'upcoming' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
                À venir
            </button>
            <button 
                onClick={() => setTimeFilter('past')}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${timeFilter === 'past' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
                Passés
            </button>
            </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        
        {activeTab === 'followup' ? (
           <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4 flex justify-between items-center">
                 <div>
                    <h3 className="text-amber-800 font-bold text-sm mb-1">Membres à contacter</h3>
                    <p className="text-amber-700 text-xs">
                        {isAdmin 
                            ? "Assignez des suivis aux leaders et consultez les rapports." 
                            : "Liste des membres nécessitant votre attention."}
                    </p>
                 </div>
                 {isAdmin && (
                     <div className="text-xs font-semibold bg-white text-amber-600 px-3 py-1 rounded-full border border-amber-200">
                         Mode Administrateur
                     </div>
                 )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="divide-y divide-gray-100">
                    {followUpTasks.map(task => (
                       <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4 group">
                          {/* Info Membre */}
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                                {task.memberName.substring(0,2).toUpperCase()}
                             </div>
                             <div>
                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                  {task.memberName}
                                </h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">{task.reason}</span>
                                    {task.daysAbsent && <span className="text-xs text-gray-500">{task.daysAbsent} jours d'absence</span>}
                                    {task.date && <span className="text-xs text-gray-400 border border-gray-100 px-1 rounded">{new Date(task.date).toLocaleDateString()}</span>}
                                </div>
                             </div>
                          </div>

                          {/* Statut et Assignation */}
                          <div className="flex-1 md:px-8">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-400">Assigné à :</span>
                                        {task.assignedTo ? (
                                            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{task.assignedTo}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">Non assigné</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-400">Statut :</span>
                                        <span className={`font-semibold px-2 py-0.5 rounded-full ${
                                            task.status === 'Terminé' ? 'bg-green-100 text-green-700' :
                                            task.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {task.status}
                                        </span>
                                        {task.lastUpdate && <span className="text-gray-400 ml-2">MAJ: {task.lastUpdate}</span>}
                                    </div>
                                </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 justify-end items-center">
                             {isAdmin ? (
                                 /* Admin Actions */
                                 <>
                                     <button 
                                        onClick={() => openAssignModal(task)}
                                        className="px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm flex items-center gap-1"
                                     >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                        {task.assignedTo ? 'Réassigner' : 'Assigner'}
                                     </button>
                                     <button onClick={() => openEditFollowUpModal(task)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-transparent hover:border-gray-200 rounded-lg" title="Modifier">
                                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                     </button>
                                 </>
                             ) : (
                                 /* User/Leader Actions */
                                 <>
                                    <button 
                                        onClick={() => handleAction(task.id, 'Appel')}
                                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" 
                                        title="Appeler et valider"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleAction(task.id, 'Visite')}
                                        className="px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Planifier Visite
                                    </button>
                                    <button onClick={() => openEditFollowUpModal(task)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-transparent hover:border-gray-200 rounded-lg" title="Modifier">
                                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                 </>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid gap-4">
             {filteredEvents.map(event => (
               <div key={event.id} className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition gap-4 sm:gap-0">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {event.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                           <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex flex-col items-center justify-center font-bold shrink-0">
                           <span className="text-xs uppercase">{new Date(event.date).toLocaleString('fr-FR', { month: 'short' })}</span>
                           <span className="text-lg leading-none">{new Date(event.date).getDate()}</span>
                        </div>
                    )}
                    <div className="min-w-0">
                       <h3 className="font-bold text-gray-900 truncate">{event.title}</h3>
                       <p className="text-sm text-gray-500 truncate">{event.time} • {event.location} • <span className="text-blue-600">{event.category}</span></p>
                       {event.description && <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{event.description}</p>}
                    </div>
                  </div>
                  
                  {/* Delete button only for admin */}
                  {currentUser?.role === 'Administrateur' && (
                    <button className="text-gray-400 hover:text-red-500 transition-colors self-end sm:self-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
               </div>
             ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun événement</h3>
            <p className="text-gray-500 text-sm">Aucun événement trouvé dans cette catégorie.</p>
          </div>
        )}
      </div>

      {/* Modal Creating Event */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Créer Événement">
         <form onSubmit={handleAddEvent} className="space-y-5 mt-2">
            
            {/* Functional Image Uploader */}
            <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleImageUpload} 
               className="hidden" 
               accept="image/png, image/jpeg" 
            />
            
            <div 
               onClick={() => fileInputRef.current?.click()}
               className={`border-2 border-dashed ${selectedImage ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'} rounded-lg h-40 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group relative overflow-hidden`}
            >
              {selectedImage ? (
                  <>
                     <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={handleRemoveImage} className="text-white bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600">Supprimer</button>
                     </div>
                  </>
              ) : (
                  <>
                    <div className="w-12 h-12 text-gray-400 mb-2 group-hover:scale-110 transition-transform">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Cliquez pour télécharger une image</p>
                    <p className="text-xs text-gray-500 mt-1">JPG ou PNG uniquement</p>
                  </>
              )}
            </div>

            <Input 
              label="Titre de l'événement" 
              placeholder="ex : Réunion Annuelle"
              value={newEvent.title} 
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} 
              required 
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Catégorie</label>
              <select 
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                value={newEvent.category}
                onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
              >
                <option>Événement</option>
                <option>Anniversaire</option>
                <option>Réunion</option>
                <option>Culte</option>
                <option>Autres</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input type="date" label="Date" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} required />
               <Input type="time" label="Heure" value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} required />
            </div>

            <Input 
              label="Lieu" 
              placeholder="ex : Salle de Conférence A"
              value={newEvent.location} 
              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} 
              required 
            />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Détails de l'événement..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              ></textarea>
            </div>
            
            <div className="pt-4 flex gap-3 border-t border-gray-100 mt-6">
             <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Annuler</Button>
             <Button type="submit" className="flex-1">Enregistrer</Button>
           </div>
         </form>
      </Modal>

      {/* Admin Assign Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assigner le Suivi">
          <div className="space-y-4 pt-2">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-600">Membre à suivre :</p>
                  <p className="font-bold text-gray-800">{selectedTask?.memberName}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Assigner à (Leader/Responsable)</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                  >
                    <option value="">Sélectionner un leader...</option>
                    <option value="Leader Demo">Leader Demo</option>
                    <option value="Pasteur Paul">Pasteur Paul</option>
                    <option value="Responsable Zone Sud">Responsable Zone Sud</option>
                  </select>
              </div>

              <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)} className="flex-1">Annuler</Button>
                  <Button type="button" onClick={handleAssignTask} disabled={!assigneeName} className="flex-1">Valider Assignation</Button>
              </div>
          </div>
      </Modal>

      {/* Create/Edit FollowUp Modal */}
      <Modal 
        isOpen={isFollowUpModalOpen} 
        onClose={() => setIsFollowUpModalOpen(false)} 
        title={currentFollowUp.id ? "Modifier le Suivi" : "Nouveau Suivi Membre"}
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-4 pt-2">
            <Input 
                label="Nom du Membre" 
                placeholder="Rechercher un membre..."
                value={currentFollowUp.memberName || ''} 
                onChange={(e) => setCurrentFollowUp({...currentFollowUp, memberName: e.target.value})}
                required
            />
            
            <div className="grid grid-cols-2 gap-4">
                 <Select 
                    label="Raison"
                    options={['Absent', 'Malade', 'Voyage', 'Nouveau', 'Autre']}
                    value={currentFollowUp.reason || 'Absent'}
                    onChange={(e) => setCurrentFollowUp({...currentFollowUp, reason: e.target.value})}
                 />
                 <Input 
                    label="Date"
                    type="date"
                    value={currentFollowUp.date || ''}
                    onChange={(e) => setCurrentFollowUp({...currentFollowUp, date: e.target.value})}
                    required
                 />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <Input 
                    label="Jours d'absence"
                    type="number"
                    value={currentFollowUp.daysAbsent || 0}
                    onChange={(e) => setCurrentFollowUp({...currentFollowUp, daysAbsent: parseInt(e.target.value)})}
                 />
                 <Select 
                    label="Statut"
                    options={['À faire', 'En cours', 'Terminé']}
                    value={currentFollowUp.status || 'À faire'}
                    onChange={(e) => setCurrentFollowUp({...currentFollowUp, status: e.target.value as any})}
                 />
            </div>

            <Select 
                label="Assigné à"
                options={['Non assigné', 'Leader Demo', 'Pasteur Paul']}
                value={currentFollowUp.assignedTo || ''}
                onChange={(e) => setCurrentFollowUp({...currentFollowUp, assignedTo: e.target.value})}
            />

            <div className="pt-4 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsFollowUpModalOpen(false)} className="flex-1">Annuler</Button>
                <Button type="submit" className="flex-1">Enregistrer</Button>
            </div>
        </form>
      </Modal>

    </div>
  );
};
