import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { MessageCircle, Send, User as UserIcon } from 'lucide-react';
import { Message } from '../types';

export default function Messagerie() {
  const { messages, users, sites, currentUser, currentRole, addMessage } = useStore();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  // Les contacts proposés dépendent du périmètre : le DT peut écrire à tout le
  // monde (vue globale) ; un PM/Propriétaire ne voit que les personnes avec
  // qui il partage au moins un site — cohérent avec l'attribution par actif
  // mise en place par ailleurs dans l'app.
  const contacts = useMemo(() => {
    if (!currentUser) return users;
    if (currentRole === 'DT') return users.filter(u => u.id !== currentUser.id);
    const mySites = new Set(currentUser.sites || []);
    return users.filter(u =>
      u.id !== currentUser.id && (u.sites || []).some(s => mySites.has(s))
    );
  }, [users, currentUser, currentRole]);

  const getThread = (contactId: string) => {
    const contact = users.find(u => u.id === contactId);
    if (!contact || !currentUser) return [];
    return messages
      .filter(m =>
        (m.fromId === currentUser.id && (m.toId === contactId || m.to === contact.name)) ||
        (m.toId === currentUser.id && (m.fromId === contactId || m.from === contact.name)) ||
        // Compatibilité avec les anciens messages mock, identifiés par nom plutôt que par ID
        (!m.fromId && !m.toId && ((m.from === currentUser.name && m.to === contact.name) || (m.from === contact.name && m.to === currentUser.name)))
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getUnreadCount = (contactId: string) => {
    if (!currentUser) return 0;
    return getThread(contactId).filter(m => !m.read && m.toId === currentUser.id).length
      || getThread(contactId).filter(m => !m.read && m.from !== currentUser.name && m.to === currentUser.name).length;
  };

  const selectedContact = users.find(u => u.id === selectedContactId);
  const thread = selectedContactId ? getThread(selectedContactId) : [];

  const handleSend = () => {
    if (!draft.trim() || !currentUser || !selectedContact) return;

    // Site de rattachement du message : un site en commun s'il y en a un,
    // sinon le premier site du contact (juste pour respecter le champ siteId existant).
    const mySites = new Set(currentUser.sites || []);
    const sharedSiteId = (selectedContact.sites || []).find(s => mySites.has(s)) || selectedContact.sites?.[0] || sites[0]?.id || '';

    const newMessage: Message = {
      id: Date.now().toString(),
      siteId: sharedSiteId,
      from: currentUser.name,
      to: selectedContact.name,
      fromId: currentUser.id,
      toId: selectedContact.id,
      message: draft.trim(),
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      read: false
    };

    addMessage(newMessage);
    setDraft('');
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md mx-auto mt-12">
        <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Choisissez une personne dans le sélecteur démo (en haut à droite) pour accéder à sa messagerie.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
          Messagerie
        </h1>
        <p className="text-gray-600">Échangez directement avec vos collègues et partenaires, sans quitter l'application</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex" style={{ height: '65vh' }}>
        {/* Liste des contacts */}
        <div className="w-72 border-r border-gray-200 overflow-y-auto">
          {contacts.length === 0 && (
            <p className="text-sm text-gray-400 p-4">Aucun contact partageant un site avec vous pour le moment.</p>
          )}
          {contacts.map(contact => {
            const unread = getUnreadCount(contact.id);
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between ${selectedContactId === contact.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                    <p className="text-xs text-gray-400">{contact.role}{contact.mandat ? ` — ${contact.mandat}` : ''}</p>
                  </div>
                </div>
                {unread > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Fil de discussion */}
        <div className="flex-1 flex flex-col">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Sélectionnez un contact pour démarrer la conversation
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-200">
                <p className="font-medium text-gray-900">{selectedContact.name}</p>
                <p className="text-xs text-gray-400">{selectedContact.role}{selectedContact.mandat ? ` — ${selectedContact.mandat}` : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.length === 0 && (
                  <p className="text-sm text-gray-400 text-center mt-8">Aucun message pour l'instant. Démarrez la conversation.</p>
                )}
                {thread.map(m => {
                  const isMine = m.fromId === currentUser.id || m.from === currentUser.name;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <p>{m.message}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>{m.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t border-gray-200 flex items-center space-x-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Écrire un message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
