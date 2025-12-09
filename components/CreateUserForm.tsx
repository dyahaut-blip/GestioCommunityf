import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { UserFormData, UserRole, ManagedGender } from '../types';

interface CreateUserFormProps {
  initialData?: UserFormData;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    role: 'Leader', // Default role updated to a valid one
    managedZone: 'Global',
    managedGender: 'Tous',
    permissions: {
      manageMembers: false,
      attendance: false,
      followups: false,
      events: false,
      exportData: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: '', // Don't populate password for security, keep empty to indicate no change
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [name]: checked,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If editing and password is empty, we would handle logic upstream to keep old password
    // For this form, we just submit what we have.
    onSubmit(formData);
  };

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Login Credentials */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identifiants</h3>
        <Input 
          label="Email (Login)" 
          name="email" 
          type="email" 
          value={formData.email} 
          onChange={handleChange}
          placeholder="ex: leader.dupont@sport.fr"
          required 
        />
        <Input 
          label="Mot de Passe" 
          name="password" 
          type="password" 
          value={formData.password} 
          onChange={handleChange}
          placeholder={isEditing ? "Laisser vide pour ne pas changer" : "••••••••"}
          required={!isEditing} 
        />
      </div>

      <div className="border-t border-gray-100 my-4"></div>

      {/* Role & Scope */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rôle & Périmètre</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select 
            label="Rôle" 
            name="role"
            options={['Administrateur', 'Responsable de zone', 'Responsable', 'Pasteur', 'Leader', 'Membre']} 
            value={formData.role} 
            onChange={handleChange} 
          />
          <Select 
            label="Zone Gérée" 
            name="managedZone"
            options={['Global', 'Nord', 'Sud', 'Est', 'Ouest']}
            value={formData.managedZone}
            onChange={handleChange}
          />
        </div>
        <Select 
          label="Genre Géré" 
          name="managedGender"
          options={['Tous', 'Homme', 'Femme']} 
          value={formData.managedGender} 
          onChange={handleChange} 
        />
      </div>

      <div className="border-t border-gray-100 my-4"></div>

      {/* Permissions */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions d'accès</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <Checkbox 
            label="Gérer les membres" 
            name="manageMembers" 
            checked={formData.permissions.manageMembers} 
            onChange={handlePermissionChange} 
          />
          <Checkbox 
            label="Pointer les présences" 
            name="attendance" 
            checked={formData.permissions.attendance} 
            onChange={handlePermissionChange} 
          />
          <Checkbox 
            label="Gérer les suivis" 
            name="followups" 
            checked={formData.permissions.followups} 
            onChange={handlePermissionChange} 
          />
          <Checkbox 
            label="Gérer les événements" 
            name="events" 
            checked={formData.permissions.events} 
            onChange={handlePermissionChange} 
          />
          <Checkbox 
            label="Exporter les données" 
            name="exportData" 
            checked={formData.permissions.exportData} 
            onChange={handlePermissionChange} 
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          {isEditing ? 'Enregistrer les modifications' : "Créer l'Utilisateur"}
        </Button>
      </div>
    </form>
  );
};