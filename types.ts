
// =============================================================================
//  TIPOS ESTRICTOS ALINEADOS CON BASE DE DATOS Y RPC
// =============================================================================

export enum ShiftType {
  DIURNO = "DIURNO",
  NOCHE = "NOCHE",
  LIBRE = "LIBRE",
}

export enum ObservationType {
  OVERTIME = "OVERTIME",
  CONSECUTIVE_DAYS = "CONSECUTIVE_DAYS",
  MISSING_HOURS = "MISSING_HOURS",
  REST_VIOLATION = "REST_VIOLATION",
}

export enum ShiftSwapStatus {
  PENDING = "Pendiente",
  APPROVED = "Aprobado",
  REJECTED = "Rechazado",
}

export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  DEPARTMENT_ADMIN = "Admin de Departamento",
  STAFF_USER = "Funcionario",
}

// ==============================
//  ENTIDADES DE BASE DE DATOS
// ==============================

export interface Observation {
  id: string;
  type: ObservationType;
  description: string;
}

export interface Employee {
  id: string;                   // uuid
  nombre: string;               // Columna DB
  apellido: string;             // Columna DB
  rut: string;                  // Columna DB
  cargo: string;                // Columna DB
  modalidad_turno: string;      // Columna DB ("24/7" | "5x2" | etc.)
  weekly_target_hours: number;  // Mapeado desde TIME a number (horas)
  
  // Mapeos y Alias para UI (Compatibilidad Frontend)
  avatarUrl: string;            
  unitId: string;               // Mapeado de departamento_id
  department: string;           // Nombre del departamento (Join)
  modality: string;             // Alias de modalidad_turno
  position: string;             // Alias de cargo
  name: string;                 // Computado: nombre + apellido
  status: string;               // Mapeado de estado ('Activo', etc)
  email?: string;               // Opcional para UI
}

export interface Shift {
  id: string;                 // uuid
  employeeId: string;         // uuid funcionario (mapeado de employee_id)
  unitId?: string;            // uuid departamento (opcional)
  date: string;               // YYYY-MM-DD
  type: ShiftType;
  startTime?: string;         // "08:00"
  endTime?: string;           // "20:00"
  notes?: string;
  observations: Observation[];
}

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  requesterShiftId: string;
  targetEmployeeId: string;
  targetShiftId: string;
  status: ShiftSwapStatus;
  requestDate: string;
  resolutionDate?: string;
  managerNotes?: string;
}

export interface Unit {
  id: string;
  name: string;           // Mapeado de 'nombre'
  manager: string;        // Mapeado de 'jefe_supervisor'
  sigla?: string;         // Mapeado de 'sigla'
  defaultModality?: string; // Mapeado de 'modalidad'
  status: 'Activo' | 'Inactivo' | 'Eliminado'; // Mapeado de 'estado'
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedDepartments: string[]; // UUIDs
  permissions: Record<string, any>; // Mapeado de JSONB
  funcionarioId?: string; // ID del funcionario asociado (BigInt -> string)
}

// ==============================
//  DATA SYSTEM & DASHBOARD
// ==============================

export interface SystemData {
  employees: Employee[];
  shifts: Shift[];
  shiftSwapRequests: ShiftSwapRequest[];
  units: Unit[];          // Necesario para el Dashboard
  userProfiles: UserProfile[]; // Necesario para Auth/Permisos
}

export const MODALITY_OPTIONS: string[] = ['Administrativo', '5x2', '24/7', '4x4', '7x7'];

// ==============================
//  TIPOS PARA IA Y ANÁLISIS
// ==============================

export interface DayDetail {
  date: string;
  weekday: string;
  hours: number;
  shiftType?: string;
  timeRange?: string;
}

export interface WeekDetail {
  label: string;
  totalHours: number;
  status: "OK" | "OVER_LIMIT" | "UNDER_TARGET";
  days: DayDetail[];
  notes?: string;
}

export interface WeeklyAnalysis {
  weeks: WeekDetail[];
  summary?: {
    totalWeeks?: number;
    averageHoursPerWeek?: number;
    comments?: string;
  };
  messages?: string[];
}
