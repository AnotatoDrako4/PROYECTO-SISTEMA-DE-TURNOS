
import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { SystemData, UserProfile, UserRole } from '../../types';
import UserModal from '../UserModal';
import { useMockData } from '../../hooks/useMockData';
import ConfirmationModal from '../ui/ConfirmationModal';
import TrashIcon from '../icons/TrashIcon';

interface PermissionsPageProps {
  data: SystemData;
  userProfile: UserProfile;
  actions: ReturnType<typeof useMockData>['actions'];
}

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const roleColors: Record<UserRole, string> = {
        [UserRole.SUPER_ADMIN]: 'bg-purple-500/20 text-purple-300',
        [UserRole.DEPARTMENT_ADMIN]: 'bg-sky-500/20 text-sky-300',
        [UserRole.STAFF_USER]: 'bg-green-500/20 text-green-300',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role]}`}>
            {role}
        </span>
    )
}

const PermissionsPage: React.FC<PermissionsPageProps> = ({ data, actions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUserClick = (user: UserProfile) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
        try {
            const result = await actions.deleteUserProfile(userToDelete.id);
            if (!result.success) {
                alert(result.error || "Error al eliminar usuario.");
            }
        } catch (error) {
            alert((error as Error).message);
        }
    }
    setIsConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleSaveUser = async (userData: Partial<UserProfile> & { password?: string }) => {
    await actions.saveUserProfile(userData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-100">Perfiles y Permisos</h1>
            <p className="text-slate-400">Gestionar el acceso de usuarios al sistema.</p>
        </div>
        <Button onClick={handleAddUser}>Añadir Usuario</Button>
      </div>

      <Card>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-white/10 text-xs text-slate-400">
                          <th className="p-4">Nombre</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Rol</th>
                          <th className="p-4">Departamentos Asignados</th>
                          <th className="p-4 text-right">Acciones</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.userProfiles.map(profile => {
                          const assignedUnits = profile.assignedDepartments
                            .map(unitId => data.units.find(u => u.id === unitId)?.name)
                            .filter(Boolean);
                          
                          const isMaster = profile.email === 'juancarbajal453@gmail.com';

                          return (
                              <tr key={profile.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
                                  <td className="p-4 font-medium flex items-center gap-2">
                                    {profile.name}
                                    {isMaster && <span title="Acceso Maestro / Dueño del Sistema" className="text-yellow-400 cursor-help">👑</span>}
                                  </td>
                                  <td className="p-4 text-slate-300">{profile.email}</td>
                                  <td className="p-4"><RoleBadge role={profile.role} /></td>
                                  <td className="p-4 text-slate-300">
                                      {profile.role === UserRole.SUPER_ADMIN ? 'Todos' : assignedUnits.join(', ')}
                                  </td>
                                  <td className="p-4 text-right">
                                      <div className="flex gap-2 justify-end">
                                          <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => handleEditUser(profile)}>Editar</Button>
                                          <Button 
                                            variant="danger" 
                                            className="text-xs py-1 px-2" 
                                            onClick={() => handleDeleteUserClick(profile)}
                                            title="Eliminar usuario"
                                            disabled={isMaster} // Proteger al dueño
                                          >
                                            <TrashIcon className="w-4 h-4" />
                                          </Button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </Card>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        units={data.units}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar Usuario`}
        message={`¿Estás seguro de que deseas eliminar al usuario "${userToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default PermissionsPage;
