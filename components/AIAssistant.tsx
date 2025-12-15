
import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { analyzeScheduleWithAI } from '../services/geminiService';
import DetalleSemanal from './ui/DetalleSemanal';
import { type SystemData, type Employee, type WeeklyAnalysis } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  data: SystemData;
  unitName: string;
  modalityFilter: Employee['modality'] | '';
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, data, unitName, modalityFilter }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [structuredResponse, setStructuredResponse] = useState<WeeklyAnalysis | null>(null);
  
  const suggestions = [
    "¿Hay riesgos de sobretiempo este mes?",
    "¿Quién tiene más días libres asignados?",
    "Verificar si se cumplen los descansos legales.",
    "Sugerir una optimización de turnos para la próxima semana."
  ];
  
  const monthName = new Date().toLocaleString('es-ES', { month: 'long' });

  const handleAnalyze = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setResponse('');
    setStructuredResponse(null);
    try {
      const result = await analyzeScheduleWithAI(prompt, data, unitName, monthName, modalityFilter);
      
      if (modalityFilter === '24/7') {
        try {
          const parsedData: WeeklyAnalysis = JSON.parse(result);
          if (parsedData && Array.isArray(parsedData.weeks)) {
            setStructuredResponse(parsedData);
          } else {
            setResponse(`La IA devolvió un formato JSON inesperado:\n${result}`);
          }
        } catch (e) {
          console.error("Failed to parse AI JSON response:", e);
          setResponse(`La IA devolvió una respuesta que no es JSON válido:\n${result}`);
        }
      } else {
        setResponse(result);
      }
    } catch (error) {
      setResponse('Hubo un error al contactar al asistente de IA.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Asistente IA para ${unitName}`}>
      <div className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
            ¿Qué te gustaría analizar? <span className="text-xs text-slate-400">(Modalidad: {modalityFilter || 'Todas'})</span>
          </label>
          <div className="mt-1">
            <textarea
              id="prompt"
              rows={3}
              className="block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100 placeholder:text-slate-400"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Detectar empleados con más de 6 días de trabajo consecutivos..."
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
                <button 
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="text-xs bg-white/10 hover:bg-white/20 text-slate-200 rounded-full px-3 py-1.5 transition-colors"
                >
                    {s}
                </button>
            ))}
        </div>

        <div className="text-right">
          <Button onClick={handleAnalyze} isLoading={isLoading}>
            Analizar Calendario
          </Button>
        </div>

        {(response || structuredResponse) && (
          <div className="mt-4 p-4 bg-black/20 rounded-lg max-h-[40vh] overflow-y-auto">
            {structuredResponse ? (
                <DetalleSemanal data={structuredResponse} />
            ) : (
                 <>
                    <h4 className="font-semibold text-lg text-slate-100 mb-2">Análisis de IA:</h4>
                    <div 
                      className="prose prose-sm max-w-none text-slate-200 prose-strong:text-slate-100 prose-headings:text-slate-100 prose-table:border-slate-700 prose-th:text-slate-200 prose-th:border-slate-600 prose-td:border-slate-700"
                      dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }}
                    />
                 </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AIAssistant;
