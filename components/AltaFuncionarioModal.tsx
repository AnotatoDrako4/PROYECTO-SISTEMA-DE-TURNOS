
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Unit, MODALITY_OPTIONS } from '../types';
import { cleanRut, formatRut, validateRut } from '../src/utils/rutUtils';
import { supabase } from '../lib/supabase';

interface AltaFuncionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  onRegister: (data: any) => Promise<void>;
}

const AltaFuncionarioModal: React.FC<AltaFuncionarioModalProps> = ({ isOpen, onClose, units }) => {
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [modalidad, setModalidad] = useState('5x2');
  const [cargo, setCargo] = useState('');
  
  // Credenciales generadas
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Algoritmo Clásica Chilena
  const generateCredentials = (rutInput: string) => {
    const limpio = cleanRut(rutInput); 
    if (!limpio) return;

    const pass = limpio.substring(0, 6);
    const email = `${limpio}@grde.cl`;

    setGeneratedEmail(email);
    setGeneratedPassword(pass);
  };

  useEffect(() => {
    if (isOpen) {
      setRut('');
      setNombre('');
      setApellido('');
      setUnidadId(units[0]?.id || '');
      setModalidad('5x2');
      setCargo('');
      setGeneratedEmail('');
      setGeneratedPassword('');
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen, units]);

  useEffect(() => {
    generateCredentials(rut);
  }, [rut]);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRut(formatRut(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateRut(rut)) {
      setError("RUT inválido.");
      return;
    }
    if (!nombre || !apellido || !unidadId || !cargo) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    setIsLoading(true);
    try {
      const rutLimpio = cleanRut(rut);
      
      const payload = {
        rut: rut, 
        rut_normalized: rutLimpio,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: generatedEmail,
        password: generatedPassword,
        unidad_id: unidadId,
        modalidad: modalidad,
        cargo: cargo.trim(),
        weekly_hours: '44:00:00' 
      };

      console.log("🚀 Invocando Edge Function 'create-official-user'...");

      // Supabase Functions Invoke
      const { data, error: invokeError } = await supabase.functions.invoke('create-official-user', {
        body: payload
      });

      if (invokeError) {
        console.error("❌ Error de Invocación (invokeError):", invokeError);
        const errorMsg = typeof invokeError === 'object' && invokeError !== null && 'message' in invokeError 
            ? (invokeError as any).message 
            : JSON.stringify(invokeError);
            
        if (errorMsg.includes("Failed to send a request")) {
             throw new Error("No se pudo conectar con la Edge Function. Puede ser un problema de CORS, Bloqueo de Red o que la función no está desplegada.");
        }
        throw new Error(`Error invocando función: ${errorMsg}`);
      }

      console.log("📥 Respuesta Edge Function:", data);

      if (data && !data.ok) {
         throw new Error(data.error || "La función respondió con error.");
      }

      setIsSuccess(true);
      
    } catch (err: any) {
      console.error("💥 Error capturado en handleSubmit:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccess = () => {
      onClose();
      window.location.reload(); 
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleCloseSuccess} title="¡Alta Exitosa!">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-slate-100">Funcionario Registrado</h3>
            <p className="text-sm text-slate-400 mt-2">
              Entrega estas credenciales al funcionario para su primer acceso.
            </p>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-left space-y-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Usuario (RUT)</label>
              <p className="text-lg font-mono text-white font-bold">{rut}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Email Interno</label>
              <p className="text-sm font-mono text-slate-300">{generatedEmail}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Contraseña Inicial</label>
              <p className="text-xl font-mono text-brand-accent tracking-widest bg-black/30 p-2 rounded border border-brand-accent/30 text-center">
                {generatedPassword}
              </p>
            </div>
          </div>

          <Button onClick={handleCloseSuccess} className="w-full">Cerrar y Finalizar</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alta de Funcionario (Login)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm text-blue-200 mb-4">
          <p>Esta acción creará un usuario en el sistema y habilitará el acceso al portal mediante RUT.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">RUT</label>
            <input 
              type="text" 
              value={rut} 
              onChange={handleRutChange}
              className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
              placeholder="12.345.678-9"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Departamento</label>
            <select 
              value={unidadId} 
              onChange={e => setUnidadId(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
            >
              {units.map(u => <option key={u.id} value={u.id} className="bg-slate-800">{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Nombre</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Apellido</label>
            <input 
              type="text" 
              value={apellido} 
              onChange={e => setApellido(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Modalidad</label>
            <select 
              value={modalidad} 
              onChange={e => setModalidad(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
            >
              {MODALITY_OPTIONS.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Cargo</label>
            <input 
              type="text" 
              value={cargo} 
              onChange={e => setCargo(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
              placeholder="Ej: Administrativo"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Credenciales a Generar (Automáticas)</p>
          <div className="flex gap-4 text-sm text-slate-400 font-mono bg-black/20 p-3 rounded">
            <div className="flex-1">
              <span className="block text-xs text-slate-600">Usuario</span>
              {rut || '---'}
            </div>
            <div className="flex-1">
              <span className="block text-xs text-slate-600">Contraseña</span>
              {generatedPassword || '---'}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex justify-end pt-4 space-x-2 border-t border-white/10 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" isLoading={isLoading}>Registrar y Generar Acceso</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AltaFuncionarioModal;
