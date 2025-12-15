import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { manageDepartmentsWithAI } from '../services/geminiService';
import { type Unit } from '../types';
import { useMockData } from '../hooks/useMockData';
import SparklesIcon from './icons/SparklesIcon';

interface DepartmentAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ReturnType<typeof useMockData>['actions'];
  units: Unit[];
}

const DepartmentAIAssistant: React.FC<DepartmentAIAssistantProps> = ({ isOpen, onClose, actions, units }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const suggestions = [
    "Crear depto. 'Obras Públicas', sigla OOP, jefe Juan Soto",
    "Cambiar jefe de 'Seguridad Ciudadana' a Ana Pérez",
    "Eliminar el departamento de 'Eventos'",
  ];

  const handleAnalyze = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setResponse('');

    try {
      const result = await manageDepartmentsWithAI(prompt, units);

      if (result.error) {
        setResponse(`Error: ${result.error}`);
      } else if (result.text) {
        setResponse(`IA: ${result.text}`);
      } else if (result.functionCall) {
        const { name, args } = result.functionCall;
        let confirmationMessage = '';
        
        if (name === 'addDepartment') {
          try {
            await actions.addUnit({ ...args, status: 'Activo' });
            confirmationMessage = `✅ Departamento "${args.name}" creado exitosamente.`;
          } catch (e) {
            confirmationMessage = `❌ Error al crear: ${(e as Error).message}. Por favor, verifique los datos.`;
          }
        } else if (name === 'deleteDepartment') {
            const unit = units.find(u => u.name.toLowerCase() === args.identifier.toLowerCase() || (u.sigla && u.sigla.toLowerCase() === args.identifier.toLowerCase()));
            if (unit && unit.status !== 'Eliminado') {
                try {
                    await actions.deleteUnit(unit.id);
                    confirmationMessage = `✅ Departamento "${unit.name}" marcado como eliminado.`;
                } catch(e) {
                    confirmationMessage = `❌ Error al eliminar: ${(e as Error).message}.`;
                }
            } else if (unit && unit.status === 'Eliminado') {
                confirmationMessage = `ℹ️ El departamento "${args.identifier}" ya se encontraba eliminado.`;
            } else {
                 confirmationMessage = `❌ No se pudo encontrar un departamento activo con el identificador "${args.identifier}".`;
            }
        } else if (name === 'updateDepartment') {
             const unit = units.find(u => u.name.toLowerCase() === args.identifier.toLowerCase() || (u.sigla && u.sigla.toLowerCase() === args.identifier.toLowerCase()));
             if(unit) {
                if (unit.status === 'Eliminado') {
                  confirmationMessage = `ℹ️ No se puede actualizar el departamento "${unit.name}" porque ha sido eliminado.`;
                } else {
                  const updatedUnit = { ...unit, ...args.updates };
                  try {
                      await actions.updateUnit(updatedUnit);
                      confirmationMessage = `✅ Departamento "${updatedUnit.name}" actualizado correctamente.`;
                  } catch (e) {
                      confirmationMessage = `❌ Error al actualizar: ${(e as Error).message}.`;
                  }
                }
             } else {
                confirmationMessage = `❌ No se pudo encontrar el departamento "${args.identifier}" para actualizar.`;
             }
        } else {
             confirmationMessage = `Función desconocida llamada: ${name}`;
        }
        
        setResponse(confirmationMessage);
        if(confirmationMessage.startsWith('✅')) {
            setPrompt(''); // Clear prompt on success
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hubo un error al procesar la solicitud.";
      setResponse(`Error: ${message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asistente IA de Departamentos">
      <div className="space-y-4">
        <div>
          <label htmlFor="prompt-dept" className="block text-sm font-medium text-slate-300">
            Describe la acción que quieres realizar:
          </label>
          <div className="mt-1">
            <textarea
              id="prompt-dept"
              rows={3}
              className="block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100 placeholder:text-slate-400"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Actualizar sigla de 'Recursos Humanos' a RRHH..."
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
            <SparklesIcon className="w-4 h-4 mr-2" />
            Procesar
          </Button>
        </div>

        {response && (
          <div className="mt-4 p-4 bg-black/20 rounded-lg">
             <h4 className="font-semibold text-md text-slate-100 mb-2">Respuesta del Asistente:</h4>
             <p className="text-slate-200 whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DepartmentAIAssistant;