import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Download, MessageCircle, Send, Clock, X, Bot } from 'lucide-react';
import { Document } from '../types';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const { currentRole, currentUser } = useStore();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<AIQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  // Charger l'historique des questions pour ce document et cet utilisateur
  useEffect(() => {
    const historyKey = `ai_history_${document.id}_${currentUser?.id}`;
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      setAiHistory(JSON.parse(savedHistory));
    }
  }, [document.id, currentUser?.id]);

  // Sauvegarder l'historique
  const saveHistory = (newHistory: AIQuestion[]) => {
    const historyKey = `ai_history_${document.id}_${currentUser?.id}`;
    localStorage.setItem(historyKey, JSON.stringify(newHistory));
    setAiHistory(newHistory);
  };

  // Simuler l'analyse IA du contrat
  const analyzeContract = async (question: string): Promise<string> => {
    // Simulation d'une réponse IA basée sur le type de document et la question
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulation délai API

    const contractResponses: { [key: string]: string } = {
      'pénalités': 'Selon l\'article 12 du contrat, les pénalités de retard sont fixées à 0,1% du montant des prestations par jour de retard, avec un plafond de 10% du montant total.',
      'préavis': 'Le préavis de résiliation est de 3 mois pour les deux parties, conformément à l\'article 15. La résiliation doit être notifiée par lettre recommandée avec accusé de réception.',
      'engagement': 'La durée d\'engagement est de 3 ans à compter de la signature, avec possibilité de reconduction tacite pour une période d\'un an.',
      'prix': 'Les prix sont révisables annuellement selon l\'indice INSEE des services aux entreprises, avec une variation maximale de +/- 5% par an.',
      'garantie': 'Le prestataire s\'engage à une garantie de parfait achèvement de 12 mois et une garantie décennale pour les travaux structurels.',
      'assurance': 'Le prestataire doit justifier d\'une assurance responsabilité civile professionnelle d\'un montant minimum de 2 millions d\'euros.'
    };

    // Recherche de mots-clés dans la question
    const questionLower = question.toLowerCase();
    for (const [keyword, response] of Object.entries(contractResponses)) {
      if (questionLower.includes(keyword)) {
        return response;
      }
    }

    // Réponse générique si aucun mot-clé trouvé
    return `D'après l'analyse du contrat "${document.name}", voici les éléments pertinents trouvés. Pour une analyse plus précise, pourriez-vous reformuler votre question en utilisant des termes spécifiques comme "pénalités", "préavis", "prix", ou "garantie" ?`;
  };

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim()) return;

    setIsLoading(true);
    try {
      const answer = await analyzeContract(currentQuestion);
      
      const newQuestion: AIQuestion = {
        id: Date.now().toString(),
        question: currentQuestion,
        answer: answer,
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [newQuestion, ...aiHistory.slice(0, 9)]; // Garder les 10 dernières questions
      saveHistory(updatedHistory);
      setCurrentAnswer(answer);
      setCurrentQuestion('');
    } catch (error) {
      setCurrentAnswer('Désolé, une erreur s\'est produite lors de l\'analyse du contrat. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = (question: AIQuestion) => {
    setCurrentAnswer(question.answer);
    setCurrentQuestion('');
  };

  const handleDownload = () => {
    // Simulation du téléchargement
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
  };

  // Vérifier les permissions d'accès
  if (currentRole !== 'PM' && currentRole !== 'DT') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="text-center">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
            <p className="text-gray-600 mb-4">
              L'accès aux contrats est réservé aux Property Managers et Directeurs Techniques.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-600">
                {document.type} • {document.size} • {new Date(document.uploadDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex">
          {/* Visualiseur de document */}
          <div className="flex-1 relative">
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aperçu du contrat</h3>
                <p className="text-gray-600 mb-4">
                  Visualisation du document : {document.name}
                </p>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto text-left">
                  <h4 className="font-semibold text-gray-900 mb-3">Contenu simulé du contrat :</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Article 1 :</strong> Objet du contrat - Maintenance technique</p>
                    <p><strong>Article 12 :</strong> Pénalités de retard : 0,1% par jour (max 10%)</p>
                    <p><strong>Article 15 :</strong> Préavis de résiliation : 3 mois</p>
                    <p><strong>Durée :</strong> 3 ans avec reconduction tacite</p>
                    <p><strong>Révision :</strong> Annuelle selon indice INSEE (+/- 5%)</p>
                    <p><strong>Assurance :</strong> RC professionnelle 2M€ minimum</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Assistant IA */}
            {!showAIAssistant && (
              <button
                onClick={() => setShowAIAssistant(true)}
                className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors group"
                title="Poser une question sur ce contrat"
              >
                <Bot className="w-5 h-5" />
                <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Poser une question sur ce contrat
                </span>
              </button>
            )}
          </div>

          {/* Assistant IA */}
          {showAIAssistant && (
            <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
              {/* Header Assistant */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bot className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Assistant IA</h3>
                  </div>
                  <button
                    onClick={() => setShowAIAssistant(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Posez vos questions sur ce contrat
                </p>
              </div>

              {/* Zone de réponse */}
              <div className="flex-1 p-4 overflow-y-auto">
                {currentAnswer && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                    <div className="flex items-start">
                      <Bot className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-800">{currentAnswer}</div>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Analyse du contrat en cours...</span>
                    </div>
                  </div>
                )}

                {/* Historique des questions */}
                {aiHistory.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Dernières questions posées :</h4>
                    <div className="space-y-2">
                      {aiHistory.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleHistoryClick(item)}
                          className="w-full text-left p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start">
                            <Clock className="w-3 h-3 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-800 font-medium">{item.question}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(item.timestamp).toLocaleDateString('fr-FR')} à {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleAskQuestion()}
                    placeholder="Posez votre question..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={!currentQuestion.trim() || isLoading}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Exemples : "Quelles sont les pénalités ?", "Quel est le préavis ?", "Durée d'engagement ?"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}