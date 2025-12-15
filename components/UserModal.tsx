
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { UserProfile, UserRole, Unit } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile> & { password?: string }) => Promise<void>;
  user: UserProfile | null;
  units: Unit[];
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, units }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STAFF_USER);
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setAssignedDepartments(user.assignedDepartments || []);
      setPassword(''); // No mostrar password al editar
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole(UserRole.STAFF_USER);
      setAssignedDepartments([]);
    }
    setError(null);
    setShowPassword(false);
  }, [isOpen, user]);

  const toggleDepartment = (unitId: string) => {
    setAssignedDepartments(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleSelectAllDepts = () => {
      if (assignedDepartments.length === units.length) {
          setAssignedDepartments([]);
      } else {
          setAssignedDepartments(units.map(u => u.id));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError("Nombre y Email son obligatorios.");
      return;
    }
    
    if (!user && !password) {
        setError("La contraseña es obligatoria para nuevos usuarios.");
        return;
    }

    if (password && password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        id: user?.id,
        name,
        email,
        role,
        assignedDepartments,
        password: password || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar usuario.");
    } finally {
      setIsLoading(false);
    }
  };

  const title = user ? "Editar Usuario" : "Añadir Nuevo Usuario";
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
            <label className="block text-sm font-medium text-slate-300">Nombre Completo</label>
            <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
                placeholder="Juan Pérez"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300">Correo Electrónico</label>
            <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
                placeholder="juan@municipalidad.cl"
                disabled={!!user} // Email suele ser inmutable o requiere proceso especial
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300">
                {user ? "Nueva Contraseña (Opcional)" : "Contraseña"}
            </label>
            <div className="relative mt-1">
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 pr-10 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
                    placeholder={user ? "Dejar en blanco para mantener" : "••••••••"}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300">Rol del Sistema</label>
            <select 
                value={role} 
                onChange={e => setRole(e.target.value as UserRole)}
                className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-slate-100 focus:border-brand focus:ring-brand sm:text-sm"
            >
                {Object.values(UserRole).map(r => (
                    <option key={r} value={r} className="bg-slate-800">{r}</option>
                ))}
            </select>
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">
                    Departamentos Asignados {isSuperAdmin && <span className="text-xs text-brand ml-2">(Super Admin accede a todo)</span>}
                </label>
                {!isSuperAdmin && (
                    <button type="button" onClick={handleSelectAllDepts} className="text-xs text-brand hover:text-brand-accent underline">
                        {assignedDepartments.length === units.length ? "Desmarcar todos" : "Marcar todos"}
                    </button>
                )}
            </div>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-white/10 rounded-xl ${isSuperAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
                {units.map(unit => (
                    <label key={unit.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                        <input 
                            type="checkbox" 
                            checked={assignedDepartments.includes(unit.id)}
                            onChange={() => toggleDepartment(unit.id)}
                            className="rounded border-white/20 bg-white/10 text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-slate-200 truncate">{unit.name}</span>
                    </label>
                ))}
            </div>
        </div>

        {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-200">
                {error}
            </div>
        )}

        <div className="flex justify-end pt-4 space-x-2 border-t border-white/10 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" isLoading={isLoading}>Guardar Usuario</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
