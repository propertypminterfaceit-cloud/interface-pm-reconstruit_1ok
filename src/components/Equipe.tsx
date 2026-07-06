import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { UserCheck, Plus, Filter, Search, Star, Mail, MessageCircle, Users, Send } from 'lucide-react';
import { User, Message } from '../types';

export default function Equipe() {
  const { users, sites, messages, prestataires, addUser, addMessage, currentRole, currentUser } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'PM' as string,
    customRole: '',
    sites: [] as string[],
    isCustomRole: false,
    prestataireId: ''
  });

  const [newMessage, setNewMessage] = useState({
    siteId: '',
    to: '',
    message: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const siteMessages = messages.filter(msg => 
    selectedSite ? msg.siteId === selectedSite : true
  );

  const handleCreateUser = () => {
    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.isCustomRole ? newUser.customRole : newUser.role,
      sites: newUser.sites,
      averageRating: 0,
      prestataireId: newUser.role === 'Prestataire' ? (newUser.prestataireId || undefined) : undefined
    };

    addUser(user);
    setShowCreateForm(false);
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'PM',
      customRole: '',
      sites: [],
      isCustomRole: false,
      prestataireId: ''
    });
  };

  const handleSendMessage = () => {
    if (!currentUser) return;

    const message: Message = {
      id: Date.now().toString(),
      siteId: newMessage.siteId,
      from: currentUser.name,
      to: newMessage.to,
      message: newMessage.message,
      date: new Date().toISOString(),
      read: false
    };

    addMessage(message);
    setShowMessageForm(false);
    setNewMessage({
      siteId: '',
      to: '',
      message: ''
    });
  };

  const handleSiteChange = (siteId: string, checked: boolean) => {
    if (checked) {
      setNewUser(prev => ({
        ...prev,
        sites: [...prev.sites, siteId]
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        sites: prev.sites.filter(id => id !== siteId)
      }));
    }
  };

  const handleSendDirectMessage = (userId: string, userName: string) => {
    setNewMessage(prev => ({ ...prev, to: userName }));
    setShowMessageForm(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PM': return 'bg-blue-100 text-blue-800';
      case 'DT': return 'bg-purple-100 text-purple-800';
      case 'Prestataire': return 'bg-green-100 text-green-800';
      case 'Propriétaire': return 'bg-orange-100 text-orange-800';
      case 'Gestionnaire technique': return 'bg-indigo-100 text-indigo-800';
      case 'Gestionnaire locatif': return 'bg-pink-100 text-pink-800';
      case 'Assistant(e) administratif': return 'bg-yellow-100 text-yellow-800';
      case 'Responsable': return 'bg-red-100 text-red-800';
      case 'Directeur de site': return 'bg-emerald-100 text-emerald-800';
      case 'Building manager': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const userStats = {
    total: users.length,
    pm: users.filter(u => u.role === 'PM').length,
    dt: users.filter(u => u.role === 'DT').length,
    prestataires: users.filter(u => u.role === 'Prestataire').length,
    proprietaires: users.filter(u => u.role === 'Propriétaire').length
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">PM</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.pm}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">DT</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.dt}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MessageCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec boutons */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
          <p className="text-gray-600">{users.length} utilisateurs au total</p>
        </div>
        
        <div className="flex space-x-3">
          {currentRole === 'DT' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un utilisateur
            </button>
          )}
          
          <button
            onClick={() => setShowMessageForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Envoyer un message
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les rôles</option>
            <option value="PM">Property Manager</option>
            <option value="DT">Directeur Technique</option>
            <option value="Prestataire">Prestataire</option>
            <option value="Propriétaire">Propriétaire</option>
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Membres de l'équipe</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      )}
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounde ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        {user.averageRating && user.averageRating > 0 && currentRole === 'DT' && (
                          <div className="flex items-center ml-2">
                            <Star className={`w-3 h-3 mr-1 ${getRatingColor(user.averageRating)}`} />
                            <span className={`text-xs ${getRatingColor(user.averageRating)}`}>
                              {user.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{user.sites?.length || 0} sites</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSendDirectMessage(user.id, user.name)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {user.sites && user.sites.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Sites assignés:</p>
                    <div className="flex flex-wrap gap-1">
                      {(user.sites || []).slice(0, 3).map(siteId => {
                        const site = sites.find(s => s.id === siteId);
                        return site ? (
                          <span key={siteId} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {site.name}
                          </span>
                        ) : null;
                      })}
                      {user.sites && user.sites.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{user.sites.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Messagerie par site */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Messagerie par site</h2>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="h-96 overflow-y-auto">
            {siteMessages.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {siteMessages.map((message) => (
                  <div key={message.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-semibold">
                          {message.from.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{message.from}</span>
                            <span className="text-xs text-gray-500">→ {message.to}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(message.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Site: {sites.find(s => s.id === message.siteId)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>Aucun message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de création d'utilisateur */}
      {showCreateForm && currentRole === 'DT' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Créer un nouvel utilisateur</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="j.dupont@interface.pm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01.23.45.67.89"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ 
                    ...prev, 
                    role: e.target.value,
                    isCustomRole: e.target.value === 'custom'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PM">Property Manager</option>
                  <option value="DT">Directeur Technique</option>
                  <option value="Prestataire">Prestataire</option>
                  <option value="Propriétaire">Propriétaire</option>
                  <option value="Gestionnaire technique">Gestionnaire technique</option>
                  <option value="Gestionnaire locatif">Gestionnaire locatif</option>
                  <option value="Assistant(e) administratif">Assistant(e) administratif</option>
                  <option value="Responsable">Responsable</option>
                  <option value="Directeur de site">Directeur de site</option>
                  <option value="Building manager">Building manager</option>
                  <option value="custom">Créer un rôle personnalisé</option>
                </select>
                
                {newUser.isCustomRole && (
                  <input
                    type="text"
                    value={newUser.customRole}
                    onChange={(e) => setNewUser(prev => ({ ...prev, customRole: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                    placeholder="Nom du rôle personnalisé"
                  />
                )}

                {newUser.role === 'Prestataire' && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">Entreprise représentée</label>
                    <select
                      value={newUser.prestataireId}
                      onChange={(e) => setNewUser(prev => ({ ...prev, prestataireId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une entreprise...</option>
                      {(prestataires || []).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Détermine quelles interventions/obligations cette personne verra.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Sites assignés</label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                  {sites.map(site => (
                    <label key={site.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUser.sites.includes(site.id)}
                        onChange={(e) => handleSiteChange(site.id, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{site.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'envoi de message */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Envoyer un message</h2>
              <button
                onClick={() => setShowMessageForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                <select
                  value={newMessage.siteId}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinataire</label>
                <input
                  type="text"
                  value={newMessage.to}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom du destinataire"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre message..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMessageForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}