
import React from 'react';
import { LOGO_SRC } from '../logo';

export const About: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 animate-in zoom-in-95 duration-500">
      
      <div className="text-center space-y-4">
        {/* Logo Replacement */}
        <div className="flex justify-center mb-6">
           <img src={LOGO_SRC} alt="Gestion Community Logo" className="w-32 h-auto object-contain" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Gestion Community</h1>
        <p className="text-gray-500 text-lg">Version 1.0.0</p>
      </div>

      <div className="grid gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Développé par</p>
            <p className="text-xl font-bold text-gray-900">Arthur Della</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 flex-shrink-0">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">E-mail</p>
            <p className="text-xl font-bold text-gray-900">dyahaut@gmail.com</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Téléphone</p>
            <p className="text-xl font-bold text-gray-900">07 07 58 65 47</p>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 space-y-2 pt-8">
        <p>Gestion Community est une application conçue pour faciliter la gestion des membres</p>
        <p>et améliorer l'organisation au sein d'une communauté religieuse.</p>
        
        <div className="flex items-center justify-center gap-2 mt-4 text-sm">
           <span>&lt;&gt; avec</span>
           <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
           <span>pour l'Église Ambassade des Miracles</span>
        </div>
      </div>
    </div>
  );
};
