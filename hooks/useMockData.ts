
import { useState, useEffect, useCallback, useRef } from "react";
import {
    Employee, Unit, Shift, ShiftType, SystemData,
    ShiftSwapStatus, ShiftSwapRequest, UserProfile, UserRole
} from "../types";
import { supabase } from "../lib/supabase";
import { hashPassword } from "../lib/auth";

// ===================================================================================
// CONSTANTES
// ===================================================================================
const CACHE_KEY = "municipalHrDataCache_v8_real_db"; 
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

// ===================================================================================
// UTILS
// ===================================================================================

async function safeFetch(table: string, label: string) {
    if (!supabase) return [];
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
        console.warn(`⚠️ Aviso: No se pudo cargar la tabla '${table}' (${label}). Detalle: ${error.message}`);
        return [];
    }
    return data || [];
}

// ===================================================================================
// MAPPERS — DB → APP (Strict Types & Real Columns)
// ===================================================================================

const safeMapDepartamentos = (rows: any[]): Unit[] =>
    rows.map((r) => ({
        id: r.id,
        name: r.nombre || "Sin Nombre",
        manager: r.jefe_supervisor || "Sin Asignar",
        sigla: r.sigla || "",
        defaultModality: r.modalidad || "5x2",
        status: r.estado || "Activo",
        createdAt: r.created_at || new Date().toISOString(),
    }));

const safeMapFuncionarios = (rows: any[], units: Unit[]): Employee[] =>
    rows.map((r) => {
        // Mapeo defensivo: busca 'nombre' (BD) o 'name' (Legacy)
        const nombre = r.nombre || "";
        const apellido = r.apellido || "";
        const fullName = [nombre, apellido].filter(Boolean).join(" ") || r.name || "Sin Nombre";
        
        // CRITICAL FIX: Mapeo exacto de columnas BD
        const unitId = r.departamento_id || r.unitId || ""; 
        const dept = units.find((u) => u.id === unitId)?.name ?? "Desconocido";

        // Parseo de horas (TIME 'HH:MM:SS' -> number)
        let hours = 44;
        const rawHours = r.weekly_target_hours || r.weeklyTargetHours;
        if (rawHours) {
            const parts = String(rawHours).split(':');
            const h = parseInt(parts[0], 10);
            if (!isNaN(h) && h >= 0) hours = h;
        }

        return {
            id: r.id?.toString(),
            // Campos DB Estrictos
            nombre: nombre,
            apellido: apellido,
            rut: r.rut || "",
            cargo: r.cargo || r.position || "",
            modalidad_turno: r.modalidad_turno || r.modality || "5x2", 
            weekly_target_hours: hours,
            
            // Campos Mapeados / Alias UI
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
            unitId: unitId,
            department: dept,
            modality: r.modalidad_turno || r.modality || "5x2", 
            position: r.cargo || r.position || "",
            name: fullName,
            status: r.estado || r.status || "Activo",
            email: r.email || ""
        };
    });

const safeMapShifts = (rows: any[]): Shift[] =>
    rows.map((r) => ({
        id: r.id,
        // Soporte para employee_id (BD real) o funcionario_id (alias anterior)
        employeeId: (r.employee_id || r.funcionario_id || "").toString(),
        unitId: r.unit_id || r.departamento_id, // Opcional
        date: r.date,
        type: r.type as ShiftType,
        startTime: r.start_time ? r.start_time.slice(0, 5) : null,
        endTime: r.end_time ? r.end_time.slice(0, 5) : null,
        observations: [], 
        notes: r.notes,
    }));

const safeMapSwaps = (rows: any[]): ShiftSwapRequest[] =>
    rows.map((r) => ({
        id: r.id,
        requesterId: r.requester_id?.toString(),
        requesterShiftId: r.requester_shift_id,
        targetEmployeeId: r.target_employee_id?.toString(),
        targetShiftId: r.target_shift_id,
        status: r.status as ShiftSwapStatus,
        requestDate: r.request_date,
        resolutionDate: r.resolution_date,
        managerNotes: r.manager_notes,
    }));

const safeMapProfiles = (rows: any[]): UserProfile[] =>
    rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: (r.role ?? UserRole.STAFF_USER) as UserRole,
        assignedDepartments: r.assigned_departments ?? [],
        permissions: r.permissions || {}, // Mapeo seguro de JSONB
        funcionarioId: r.funcionario_id ? r.funcionario_id.toString() : undefined, // BigInt a string
    }));

// ===================================================================================
// HOOK PRINCIPAL
// ===================================================================================
export const useMockData = () => {
    const [data, setData] = useState<SystemData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isMounted = useRef(true);
    const inflight = useRef<Promise<void> | null>(null);

    const fetchData = useCallback(async (force = false) => {
        if (!supabase) {
            setError("❌ Supabase no inicializado.");
            setLoading(false);
            return;
        }

        if (!force) {
            try {
                const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
                if (cache?.data && Date.now() - cache.timestamp < CACHE_TTL) {
                    setData(cache.data);
                    setLoading(false);
                    return;
                }
            } catch {
                localStorage.removeItem(CACHE_KEY);
            }
        }

        if (inflight.current) return inflight.current;

        inflight.current = (async () => {
            try {
                if (!data) setLoading(true);
                setError(null);

                // 1. Intentar cargar vía RPC (Optimización)
                let rpcData = null;
                const { data: rpcResult, error: rpcError } = await supabase.rpc('get_calendar_data');
                if (!rpcError && rpcResult && rpcResult.employees) {
                    rpcData = rpcResult;
                    console.log("✅ Datos cargados vía RPC get_calendar_data");
                }

                // 2. Cargar tablas complementarias (o todo si falló RPC)
                const [rawDepts, rawSwaps, rawProfiles] = await Promise.all([
                    safeFetch("departamentos", "Departamentos"),
                    safeFetch("shift_swap_requests", "Solicitudes"),
                    safeFetch("user_profiles", "Perfiles")
                ]);

                // 3. Obtener Empleados y Turnos (RPC o Manual)
                let rawEmps = [];
                let rawShifts = [];

                if (rpcData) {
                    rawEmps = rpcData.employees;
                    rawShifts = rpcData.shifts;
                } else {
                    // Fallback manual: SELECT normal
                    [rawEmps, rawShifts] = await Promise.all([
                        safeFetch("funcionarios", "Funcionarios"),
                        safeFetch("turnos", "Turnos") 
                    ]);
                }

                // 4. Mapeo Seguro
                const units = safeMapDepartamentos(rawDepts);
                const employees = safeMapFuncionarios(rawEmps, units);
                const shifts = safeMapShifts(rawShifts);
                const shiftSwapRequests = safeMapSwaps(rawSwaps);
                const userProfiles = safeMapProfiles(rawProfiles);

                // Admin local fallback
                if (userProfiles.length === 0) {
                    userProfiles.push({
                        id: "admin-local",
                        email: "admin@local",
                        name: "Administrador Local",
                        role: UserRole.SUPER_ADMIN,
                        assignedDepartments: [],
                        permissions: {},
                    });
                }

                const finalData: SystemData = {
                    units,
                    employees,
                    shifts,
                    shiftSwapRequests,
                    userProfiles,
                };

                if (isMounted.current) {
                    setData(finalData);
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: finalData, timestamp: Date.now() }));
                }
            } catch (err: any) {
                console.error("❌ Error global en fetch:", err);
                if (isMounted.current) setError(err.message || "Error inesperado al cargar datos.");
            } finally {
                inflight.current = null;
                if (isMounted.current) setLoading(false);
            }
        })();

        return inflight.current;
    }, [data]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => { isMounted.current = false; };
    }, []);

    // Actions
    const refresh = () => fetchData(true);

    const saveUnit = async (unit: Partial<Unit>) => {
        const payload = {
            nombre: unit.name,
            sigla: unit.sigla,
            jefe_supervisor: unit.manager,
            modalidad: unit.defaultModality,
            estado: unit.status ?? "Activo"
        };
        
        let error;
        if (unit.id) {
             const { error: upError } = await supabase.from("departamentos").update(payload).eq('id', unit.id);
             error = upError;
        } else {
             const { error: inError } = await supabase.from("departamentos").insert(payload);
             error = inError;
        }
        if (error) throw new Error(`Error guardando departamento: ${error.message}`);
        await refresh();
    };

    const deleteUnit = async (id: string) => {
        const { error } = await supabase.from("departamentos").update({ estado: "Eliminado" }).eq("id", id);
        if (error) throw new Error(`Error eliminando departamento: ${error.message}`);
        await refresh();
    };

    const saveEmployee = async (emp: any) => {
        if (!emp.rut || !emp.unitId) throw new Error("RUT y Departamento son obligatorios.");

        // Separar nombre y apellido
        let nombre = emp.nombre || "";
        let apellido = emp.apellido || "";
        if (!nombre && emp.name) {
            const parts = emp.name.trim().split(/\s+/);
            nombre = parts[0] || "";
            apellido = parts.slice(1).join(" ") || "";
        }

        const rutNormalized = (emp.rut || "").replace(/[^0-9kK]/g, '').toUpperCase();
        
        // Convertir horas number -> string TIME 'HH:00:00'
        const hoursInt = parseInt(String(emp.weeklyTargetHours || emp.weekly_target_hours || 44), 10);
        const weeklyHoursValue = (hoursInt >= 0 && hoursInt < 24) 
            ? `${hoursInt.toString().padStart(2, '0')}:00:00` 
            : "00:00:00";

        // PAYLOAD ESTRICTO SEGÚN DB (Minúsculas)
        const payload = {
            rut: emp.rut,
            nombre: nombre,
            apellido: apellido,
            email: emp.email || null,
            cargo: emp.position || emp.cargo,
            modalidad_turno: emp.modality || emp.modalidad_turno || "5x2",
            estado: emp.status || emp.estado || "Activo",
            weekly_target_hours: weeklyHoursValue,
            departamento_id: emp.unitId,
            rut_normalized: rutNormalized
        };

        let error;
        if (emp.id && !String(emp.id).startsWith('temp')) {
            const { error: upError } = await supabase.from("funcionarios").update(payload).eq("id", emp.id);
            error = upError;
        } else {
            const { error: inError } = await supabase.from("funcionarios").insert(payload);
            error = inError;
        }
        
        if (error) {
            if (error.message.includes('has no field "updated_at"')) {
                throw new Error('❌ Error DB: Existe un trigger buscando "updated_at". Ejecuta: DROP TRIGGER IF EXISTS handle_updated_at ON public.funcionarios;');
            }
            throw new Error(`Error guardando funcionario: ${error.message}`);
        }
        await refresh();
    };

    // NUEVO: Registro de Funcionario Oficial con Auth
    const registerOfficial = async (payload: any) => {
        const { data: result, error: edgeError } = await supabase.functions.invoke('create-official-user', {
            body: payload
        });

        if (edgeError) {
            throw new Error(`Error Edge Function: ${edgeError.message}`);
        }
        if (result && result.error) {
            throw new Error(result.error);
        }
        
        await refresh();
        return result;
    };

    const deleteEmployee = async (id: string) => {
        const { error } = await supabase.from("funcionarios").delete().eq("id", id);
        if (error) throw new Error(`Error eliminando funcionario: ${error.message}`);
        await refresh();
    };

    const saveUserProfile = async (profile: Partial<UserProfile> & { password?: string }) => {
        let securityPayload = {};
        
        if (profile.password) {
            const { hash, salt } = await hashPassword(profile.password);
            securityPayload = { password_hash: hash, password_salt: salt };
        }

        const payload = {
            id: profile.id || undefined,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            assigned_departments: profile.assignedDepartments,
            ...securityPayload
        };

        const { data, error } = await supabase.rpc('admin_save_user', {
            p_data: payload
        });

        if (error) {
            if (error.message.includes('function admin_save_user') && error.message.includes('does not exist')) {
                 throw new Error("⚠️ Error Crítico: Falta la función RPC 'admin_save_user'.");
            }
            throw new Error(`Error guardando perfil: ${error.message}`);
        }
        
        if (data && !data.success) {
             throw new Error(data.message || "Error desconocido al guardar usuario.");
        }

        await refresh();
    };

    const deleteUserProfile = async (id: string) => {
        setLoading(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('admin_delete_user', {
                p_target_user_id: id
            });

            if (rpcError) throw rpcError;
            if (data && !data.success) throw new Error(data.message || "Error desconocido.");

            await refresh();
            return { success: true };

        } catch (err: any) {
            return { success: false, error: err.message || "Error al eliminar usuario" };
        } finally {
            setLoading(false);
        }
    };

    const saveShift = async (shift: Partial<Shift>) => {
        let finalUnitId = shift.unitId;
        
        if (!finalUnitId && data?.employees) {
            const emp = data.employees.find(e => e.id === shift.employeeId);
            if (emp) finalUnitId = emp.unitId;
        }

        const payload: any = {
            employee_id: shift.employeeId, 
            unit_id: finalUnitId,
            date: shift.date,
            type: shift.type,
            start_time: shift.startTime ?? null,
            end_time: shift.endTime ?? null,
            notes: shift.notes ?? "",
        };

        let error;
        
        if (shift.id) {
             const { error: upError } = await supabase.from("turnos").update(payload).eq('id', shift.id);
             error = upError;
        } else {
             try {
                 const { data: exists, error: checkError } = await supabase.from("turnos")
                    .select('id')
                    .eq('employee_id', shift.employeeId)
                    .eq('date', shift.date)
                    .maybeSingle();

                 if (checkError) throw checkError;
                    
                 if (exists) {
                    const { error: upError } = await supabase.from("turnos").update(payload).eq('id', exists.id);
                    error = upError;
                 } else {
                    const { error: inError } = await supabase.from("turnos").insert(payload);
                    error = inError;
                 }
             } catch(e: any) {
                 if (e.message && e.message.includes("invalid input syntax for type uuid")) {
                     throw new Error("❌ Error de Tipos DB: Conflictos UUID/BigInt.");
                 }
                 throw e;
             }
        }
        
        if (error) throw new Error(`Error guardando turno: ${error.message}`);
        await refresh();
    };

    const deleteShift = async (id: string) => {
        const { error } = await supabase.from("turnos").delete().eq("id", id);
        if (error) throw new Error(`Error eliminando turno: ${error.message}`);
        await refresh();
    };

    const saveBatchShifts = async (shifts: Partial<Shift>[]) => {
        if (!shifts.length) return;

        const resolvedShifts = shifts.map(s => {
            let unitId = s.unitId;
            if (!unitId && data?.employees) {
                 const emp = data.employees.find(e => e.id === s.employeeId);
                 if (emp) unitId = emp.unitId;
            }
            return {
                employee_id: s.employeeId,
                unit_id: unitId,
                date: s.date,
                type: s.type,
                start_time: s.startTime ?? null,
                end_time: s.endTime ?? null,
                notes: s.notes ?? ""
            };
        });

        const dates = resolvedShifts.map(s => s.date);
        const employeeIds = [...new Set(resolvedShifts.map(s => s.employee_id))];

        await supabase.from("turnos")
            .delete()
            .in('employee_id', employeeIds)
            .in('date', dates);

        const { error } = await supabase.from("turnos").insert(resolvedShifts);

        if (error) throw new Error(`Error en guardado masivo: ${error.message}`);
        await refresh();
    };

    const createSwapRequest = async (targetEmployeeId: string, targetShiftId: string, requesterShift: Shift) => {
        const { error } = await supabase.from("shift_swap_requests").insert({
            requester_id: requesterShift.employeeId,
            requester_shift_id: requesterShift.id,
            target_employee_id: targetEmployeeId,
            target_shift_id: targetShiftId,
            status: ShiftSwapStatus.PENDING,
            request_date: new Date().toISOString(),
        });
        if (error) throw new Error(`Error creando solicitud: ${error.message}`);
        await refresh();
    };

    const approveSwapRequest = async (id: string) => {
        const { error } = await supabase.from("shift_swap_requests").update({
            status: ShiftSwapStatus.APPROVED,
            resolution_date: new Date().toISOString(),
        }).eq("id", id);
        if (error) throw new Error(`Error aprobando solicitud: ${error.message}`);
        await refresh();
    };

    const rejectSwapRequest = async (id: string, notes: string) => {
        const { error } = await supabase.from("shift_swap_requests").update({
            status: ShiftSwapStatus.REJECTED,
            manager_notes: notes,
            resolution_date: new Date().toISOString(),
        }).eq("id", id);
        if (error) throw new Error(`Error rechazando solicitud: ${error.message}`);
        await refresh();
    };

    const swap = async (req: ShiftSwapRequest) => { await refresh(); };

    return {
        data,
        loading,
        error,
        actions: {
            refresh,
            saveUnit,
            addUnit: saveUnit,
            updateUnit: saveUnit,
            deleteUnit,
            saveEmployee,
            registerOfficial, // NUEVA FUNCIÓN
            deleteEmployee,
            saveShift,
            deleteShift,
            saveBatchShifts,
            swap,
            createSwapRequest,
            approveSwapRequest,
            rejectSwapRequest,
            saveUserProfile,
            deleteUserProfile,
        },
    };
};
