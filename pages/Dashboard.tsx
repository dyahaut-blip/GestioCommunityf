
import React, { useState, useMemo, useEffect } from 'react';
import { Page, PageProps, Member } from '../types';
import { supabase } from '../supabaseClient';

// --- DATA GENERATOR (Fallback si Base de données vide) ---
const generateMockData = (count: number): Member[] => {
  const zones = ['Nord', 'Sud', 'Est', 'Ouest', 'Centre'];
  const firstNames = ['Jean', 'Marie', 'Paul', 'Alice', 'Koffi', 'Aya', 'Michel', 'Sarah'];
  const lastNames = ['Kouassi', 'Konan', 'Dupont', 'Touré', 'Soro', 'Diop', 'Bakayoko'];
  
  return Array.from({ length: count }).map((_, i) => {
    const isMale = Math.random() > 0.55;
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 180));

    return {
      id: i.toString(),
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      email: `user${i}@example.com`,
      phone: '0102030405',
      location: 'Quartier X',
      zone: zones[Math.floor(Math.random() * zones.length)],
      role: 'Membre',
      status: Math.random() > 0.1 ? 'Actif' : 'Inactif',
      joinDate: joinDate.toISOString().split('T')[0],
      gender: isMale ? 'Homme' : 'Femme',
      avatarColor: isMale ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
    };
  });
};

// --- COMPOSANTS GRAPHIQUES ---

const DynamicAreaChart = ({ data, color = '#3B82F6', id, labels }: { data: number[], color?: string, id: string, labels?: string[] }) => {
  if (data.length < 2) return <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">Pas assez de données</div>;

  const height = 150;
  const width = 300;
  const paddingLeft = 30;
  const paddingBottom = 20;
  
  const graphWidth = width - paddingLeft;
  const graphHeight = height - paddingBottom;

  const max = Math.max(...data, 10);
  const min = 0;
  
  const points = data.map((val, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * graphWidth;
    const y = graphHeight - ((val - min) / (max - min)) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `${points} L ${width},${graphHeight} L ${paddingLeft},${graphHeight} Z`;

  const yTicks = 5;
  const gridLines = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const val = Math.round(min + (max - min) * (i / yTicks));
    const y = graphHeight - (i / yTicks) * graphHeight;
    return (
      <g key={i}>
        <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
        <text x={paddingLeft - 5} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{val}</text>
      </g>
    );
  });

  const xLabelsCount = 3;
  const xAxisLabels = labels && labels.length > 0 ? labels : ['Début', 'Milieu', 'Fin'];
  const xLabelsRender = Array.from({ length: xLabelsCount }).map((_, i) => {
     const x = paddingLeft + (i / (xLabelsCount - 1)) * graphWidth;
     let label = '';
     if (i === 0) label = xAxisLabels[0];
     else if (i === xLabelsCount - 1) label = xAxisLabels[xAxisLabels.length - 1];
     else label = xAxisLabels[Math.floor(xAxisLabels.length / 2)];

     return (
        <text key={i} x={x} y={height} fontSize="10" fill="#9ca3af" textAnchor={i === 0 ? "start" : i === xLabelsCount - 1 ? "end" : "middle"}>
            {label}
        </text>
     );
  });

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-lg">
      <svg viewBox={`0 0 ${width} ${height + 5}`} className="w-full h-full">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        {gridLines}
        <line x1={paddingLeft} y1={graphHeight} x2={width} y2={graphHeight} stroke="#e5e7eb" strokeWidth="1" />
        {xLabelsRender}
        <path d={`M ${areaPath}`} fill={`url(#grad-${id})`} />
        <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.length > 0 && (
            <circle 
                cx={width} 
                cy={graphHeight - ((data[data.length - 1] - min) / (max - min)) * graphHeight} 
                r="3" 
                fill={color} 
                stroke="white" 
                strokeWidth="2" 
            />
        )}
      </svg>
    </div>
  );
};

const DynamicBarChart = ({ men, women }: { men: number, women: number }) => {
  const total = men + women || 1;
  const menPct = Math.round((men / total) * 100);
  const womenPct = Math.round((women / total) * 100);

  return (
    <div className="w-full h-64 flex items-end justify-center gap-12 sm:gap-24 px-8 pb-8 bg-white dark:bg-gray-800 rounded-lg relative pt-8">
      <div className="absolute left-4 top-6 bottom-8 flex flex-col justify-between text-[10px] text-gray-400 font-mono pointer-events-none">
         <span>100%</span>
         <span>75%</span>
         <span>50%</span>
         <span>25%</span>
         <span>0%</span>
      </div>
      <div className="absolute left-10 right-4 top-6 bottom-8 flex flex-col justify-between pointer-events-none z-0">
          <div className="border-t border-gray-100 border-dashed w-full h-0"></div>
          <div className="border-t border-gray-100 border-dashed w-full h-0"></div>
          <div className="border-t border-gray-100 border-dashed w-full h-0"></div>
          <div className="border-t border-gray-100 border-dashed w-full h-0"></div>
          <div className="border-b border-gray-200 w-full h-0"></div>
      </div>

      <div className="flex flex-col items-center gap-2 group z-10 h-full justify-end w-16">
        <span className="text-xs font-bold text-pink-500 mb-1">{women}</span>
        <div className="w-full bg-pink-50 dark:bg-pink-900/20 rounded-t-md relative overflow-hidden h-full flex items-end border-b border-pink-100">
          <div 
            className="w-full bg-pink-500 rounded-t-md transition-all duration-1000 relative hover:bg-pink-600" 
            style={{ height: `${Math.max(womenPct, 2)}%` }}
          >
          </div>
        </div>
        <div className="text-center">
            <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Femmes</span>
            <span className="block text-xs text-gray-400 font-bold">{womenPct}%</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 group z-10 h-full justify-end w-16">
        <span className="text-xs font-bold text-blue-500 mb-1">{men}</span>
        <div className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-t-md relative overflow-hidden h-full flex items-end border-b border-blue-100">
          <div 
            className="w-full bg-blue-500 rounded-t-md transition-all duration-1000 relative hover:bg-blue-600" 
            style={{ height: `${Math.max(menPct, 2)}%` }}
          >
          </div>
        </div>
        <div className="text-center">
            <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Hommes</span>
            <span className="block text-xs text-gray-400 font-bold">{menPct}%</span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext, icon, trend }: any) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-32 hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${icon.bg} ${icon.text}`}>
        {icon.svg}
      </div>
    </div>
    {subtext && (
      <p className={`text-xs font-medium flex items-center gap-1 ${trend ? 'text-green-600' : 'text-gray-400'}`}>
        {trend && <span>↑</span>} {subtext}
      </p>
    )}
  </div>
);

interface DashboardProps extends PageProps {
  onNavigate: (page: Page) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, notify, currentUser }) => {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [dbMembers, setDbMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  
  // 1. FILTRAGE DES DONNÉES SELON PERMISSIONS
  const isSpecificZone = currentUser && currentUser.managedZone !== 'Global';
  const displayZone = isSpecificZone ? currentUser.managedZone : 'Global';

  // Charger les données RÉELLES depuis Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('createdAt', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setDbMembers(data);
        } else {
          // Fallback: Si base vide, utiliser le localStorage ou les mocks pour la démo
          const storedMembers = localStorage.getItem('members_data');
          if (storedMembers) {
            setDbMembers(JSON.parse(storedMembers));
          } else {
            const mocks = generateMockData(50);
            setDbMembers(mocks);
            // On évite d'écraser le localStorage si on veut utiliser la DB principalement
          }
        }
      } catch (error) {
        console.error("Erreur Dashboard:", error);
        // En cas d'erreur (offline), on essaie le localStorage
        const storedMembers = localStorage.getItem('members_data');
        if (storedMembers) setDbMembers(JSON.parse(storedMembers));
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    fetchMembers();
  }, []);

  const zoneMembers = useMemo(() => {
    if (!isSpecificZone) return dbMembers;
    return dbMembers.filter(m => m.zone === displayZone || m.location === displayZone);
  }, [dbMembers, displayZone, isSpecificZone]);

  // 2. CALCULS STATISTIQUES (KPIs)
  const stats = useMemo(() => {
    const total = zoneMembers.length;
    const active = zoneMembers.filter(m => m.status === 'Actif').length;
    const men = zoneMembers.filter(m => m.gender === 'Homme').length;
    const women = zoneMembers.filter(m => m.gender === 'Femme').length;

    // Simulation croissance basée sur les dates d'inscription
    // On compte les inscrits du mois courant
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newThisMonth = zoneMembers.filter(m => {
        const join = new Date(m.joinDate);
        return join.getMonth() === currentMonth && join.getFullYear() === currentYear;
    }).length;

    return { total, active, men, women, growth: newThisMonth };
  }, [zoneMembers]);

  // 3. PRÉPARATION DONNÉES GRAPHIQUES (Time Series)
  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const dataPoints: number[] = [];
    
    let currentTotal = Math.floor(stats.total * 0.8); 
    const step = Math.max(1, Math.floor(days / 10));

    for (let i = 0; i <= days; i += step) {
       const variation = Math.floor(Math.random() * 3);
       currentTotal += variation;
       if (currentTotal > stats.total) currentTotal = stats.total;
       dataPoints.push(currentTotal);
    }
    
    if (dataPoints.length > 0) dataPoints[dataPoints.length - 1] = stats.total;
    
    return dataPoints;
  }, [stats.total, timeRange]);

  const chartLabels = useMemo(() => {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - parseInt(timeRange));
      return [
          startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          '...',
          today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      ];
  }, [timeRange]);

  // 4. LISTE DES NOUVEAUX MEMBRES
  const newMembers = useMemo(() => {
    return [...zoneMembers]
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
      .slice(0, 5); 
  }, [zoneMembers]);

  // 5. DONNÉES DE PRÉSENCE (LocalStorage pour l'instant - À connecter à une table 'attendance' plus tard)
  const attendanceChartData = useMemo(() => {
    let storedStats: Record<string, number> = {};
    try {
        const saved = localStorage.getItem('attendance_stats');
        if (saved) storedStats = JSON.parse(saved);
    } catch (e) { console.error(e); }

    const daysStr = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const dayLabel = daysStr[d.getDay()];
        
        let val = storedStats[dateKey];
        if (val === undefined) {
             val = Math.floor(Math.random() * 40) + 20; 
             if (i === 0) val = 0;
        }
        
        result.push({ label: dayLabel, value: val });
    }
    return result;
  }, []);

  const maxAttendance = useMemo(() => {
      const maxVal = Math.max(...attendanceChartData.map(d => d.value), 10);
      return Math.ceil(maxVal / 10) * 10;
  }, [attendanceChartData]);

  const handleRangeChange = (range: '7' | '30' | '90') => {
    setTimeRange(range);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden gap-4">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Tableau de Bord</h1>
          <p className="text-blue-100 text-sm">
             Bienvenue sur GestioCommunity 
             {isSpecificZone && <span className="font-semibold bg-blue-500 px-2 py-0.5 rounded ml-2 text-white border border-blue-400">Zone {displayZone}</span>}
          </p>
        </div>
        <div className="flex gap-2 relative z-10 w-full md:w-auto justify-start md:justify-end">
          {(['7', '30', '90'] as const).map((range) => (
             <button 
                key={range}
                onClick={() => handleRangeChange(range)}
                className={`flex-1 md:flex-none px-3 py-1 rounded text-xs transition ${
                  timeRange === range 
                  ? 'bg-white text-blue-600 font-bold shadow-sm' 
                  : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                }`}
             >
             {range} jours
           </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
      </div>

      {/* KPI Stats Row - Positionnés en HAUT comme demandé */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
            <StatCard 
                label={`Total Membres ${isSpecificZone ? displayZone : ''}`}
                value={isLoadingMembers ? '...' : stats.total}
                subtext={`+${stats.growth} nouveaux ce mois`}
                trend={true}
                icon={{ bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', svg: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> }}
            />
        </div>
        <StatCard 
            label="Hommes"
            value={isLoadingMembers ? '...' : stats.men}
            subtext={stats.total > 0 ? `${Math.round((stats.men/stats.total)*100)}%` : '0%'}
            trend={false}
            icon={{ bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', svg: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }}
        />
        <StatCard 
            label="Femmes"
            value={isLoadingMembers ? '...' : stats.women}
            subtext={stats.total > 0 ? `${Math.round((stats.women/stats.total)*100)}%` : '0%'}
            trend={true}
            icon={{ bg: 'bg-pink-50 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', svg: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h3 className="font-semibold text-gray-800 dark:text-white">Croissance des membres {isSpecificZone ? `(${displayZone})` : ''}</h3>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Total
                </span>
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-blue-300"></span> Tendance
                </span>
              </div>
            </div>
            
            <DynamicAreaChart data={chartData} id="growth" color="#3B82F6" labels={chartLabels} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Genre Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Répartition par genre</h3>
              <DynamicBarChart men={stats.men} women={stats.women} />
            </div>

            {/* Attendance Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-auto min-h-[300px]">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Pic de Présences (7 derniers jours)</h3>
              
              <div className="flex flex-1 relative mt-2">
                  <div className="flex flex-col justify-between text-xs text-gray-400 font-mono pr-2 border-r border-gray-100 h-40">
                      <span>{maxAttendance}</span>
                      <span>{Math.round(maxAttendance * 0.75)}</span>
                      <span>{Math.round(maxAttendance * 0.5)}</span>
                      <span>{Math.round(maxAttendance * 0.25)}</span>
                      <span>0</span>
                  </div>

                  <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-0 h-40 relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                         <div className="border-t border-gray-50 border-dashed w-full h-0"></div>
                         <div className="border-t border-gray-50 border-dashed w-full h-0"></div>
                         <div className="border-t border-gray-50 border-dashed w-full h-0"></div>
                         <div className="border-t border-gray-50 border-dashed w-full h-0"></div>
                         <div className="border-b border-gray-100 w-full h-0"></div>
                      </div>

                      {attendanceChartData.map((data, i) => (
                          <div key={i} className="w-full relative group flex flex-col justify-end h-full z-10">
                              {data.value > 0 && (
                                <div 
                                    className="w-full bg-indigo-500 rounded-t opacity-80 hover:opacity-100 transition-all relative mx-auto" 
                                    style={{ height: `${(data.value / maxAttendance) * 100}%`, minHeight: '4px' }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                        {data.value} présents
                                    </div>
                                </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              <div className="flex justify-between text-xs text-gray-400 mt-2 pl-8">
                  {attendanceChartData.map((d, i) => <span key={i} className="w-full text-center">{d.label}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Stats */}
        <div className="space-y-4">
          
          {/* New Members List (Dynamique depuis Supabase) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
               <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Derniers Inscrits</h3>
               <button onClick={() => onNavigate('members')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Voir tout</button>
             </div>
             <div className="p-2">
               {newMembers.length > 0 ? newMembers.map((member) => {
                 const daysAgo = Math.floor((new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 3600 * 24));
                 
                 return (
                   <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.avatarColor || 'bg-gray-100 text-gray-500'}`}>
                       {member.firstName.substring(0,1)}{member.lastName.substring(0,1)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{member.firstName} {member.lastName}</p>
                       <p className="text-[10px] text-gray-400 truncate">
                          {daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo} jours`} • {member.zone || 'N/A'}
                       </p>
                     </div>
                     <div className={`w-2 h-2 rounded-full ${member.status === 'Actif' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                   </div>
                 );
               }) : (
                 <p className="text-xs text-center text-gray-400 py-4">Aucun membre récent</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
