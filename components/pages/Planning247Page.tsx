import React, { useState, useMemo, useCallback } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import {
    SystemData,
    UserProfile,
    Shift,
    ShiftType,
    Employee
} from "../../types";
import { useMockData } from "../../hooks/useMockData";
import WeeklyValidationPanel from "../ui/WeeklyValidationPanel";
import ShiftModal from "../ShiftModal";
import ModalityPill from "../ui/ModalityPill";
import { motion } from "framer-motion";

// ----------------------------------------------
// SAFE IMAGE COMPONENT
// ----------------------------------------------
const SafeAvatar = ({ src, alt }: { src?: string; alt: string }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className="h-10 w-10 rounded-full bg-slate-700/50 text-xs
                            flex items-center justify-center text-slate-400">
                ?
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            className="h-10 w-10 rounded-full object-cover"
        />
    );
};

// ----------------------------------------------
// SAFE DATE HELPERS (NO CRASH TZ)
// ----------------------------------------------
const safeDate = (dateStr: string): Date | null => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

// ----------------------------------------------
// DAY CELL
// ----------------------------------------------
interface DayCellProps {
    day: Date;
    shift?: Shift;
    onClick: () => void;
    isToday: boolean;
}

const DayCell: React.FC<DayCellProps> = ({
    day,
    shift,
    onClick,
    isToday
}) => {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 0.98 }}
            className={`h-24 border border-white/5 p-1 cursor-pointer transition-colors
                relative group
                ${isWeekend ? "bg-slate-900/40" : "bg-slate-900/20"}
                ${isToday ? "ring-1 ring-brand ring-inset" : ""}
                hover:bg-white/5`}
        >
            <div
                className={`text-xs font-medium mb-1 ${
                    isToday ? "text-brand" : "text-slate-400"
                }`}
            >
                {day.getDate()}
            </div>

            {/* SHIFT PRESENT */}
            {shift && shift.type !== ShiftType.LIBRE ? (
                <div
                    className={`rounded px-1.5 py-1 text-xs border border-white/10
                        ${
                            shift.type === ShiftType.DIURNO
                                ? "bg-sky-500/20 text-sky-300"
                                : "bg-indigo-500/20 text-indigo-300"
                        }`}
                >
                    <div className="font-bold">{shift.type}</div>
                    <div className="font-mono text-[10px] opacity-80">
                        {shift.startTime ?? "--"}-{shift.endTime ?? "--"}
                    </div>
                </div>
            ) : shift?.type === ShiftType.LIBRE ? (
                <div className="rounded px-1.5 py-1 text-xs bg-slate-700/30 text-slate-500 text-center">
                    L
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center
                                opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-2xl text-white/20">+</span>
                </div>
            )}
        </motion.div>
    );
};

// ----------------------------------------------
// MAIN COMPONENT (HARDENED)
// ----------------------------------------------
const Planning247Page = ({
    data,
    actions,
    userProfile
}: {
    data: SystemData;
    actions: ReturnType<typeof useMockData>["actions"];
    userProfile: UserProfile;
}) => {
    // fallback seguro
    const units = data?.units ?? [];
    const employees = data?.employees ?? [];
    const shifts = data?.shifts ?? [];

    const FIRST_UNIT = units[0]?.id ?? "";

    const [selectedUnit, setSelectedUnit] = useState(FIRST_UNIT);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
        null
    );
    const [shiftModalData, setShiftModalData] = useState<
        Shift | { employeeId: string; date: string } | null
    >(null);

    // ----------------------------------------
    // EMPLEADOS 24/7 (CON VALIDACIÓN)
    // ----------------------------------------
    const employees247 = useMemo(() => {
        try {
            return employees.filter(
                (e: Employee) =>
                    e?.modality === "24/7" &&
                    e?.status === "Activo" &&
                    (!selectedUnit || e.unitId === selectedUnit)
            );
        } catch (e) {
            console.error("Error filtrando empleados 24/7", e);
            return [];
        }
    }, [employees, selectedUnit]);

    // ----------------------------------------
    // DÍAS DEL MES (SIN OFFSET)
    // ----------------------------------------
    const daysInMonth = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const days: Date[] = [];

        const total = new Date(y, m + 1, 0).getDate();

        for (let d = 1; d <= total; d++) {
            const safe = new Date(y, m, d);
            if (!isNaN(safe.getTime())) days.push(safe);
        }
        return days;
    }, [currentDate]);

    // ----------------------------------------
    // CAMBIAR MES
    // ----------------------------------------
    const changeMonth = useCallback(
        (delta: number) => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + delta);

            if (isNaN(newDate.getTime())) {
                console.warn("Fecha inválida al cambiar mes.");
                return;
            }

            setCurrentDate(newDate);
        },
        [currentDate]
    );

    // ----------------------------------------
    // CLICK DÍA
    // ----------------------------------------
    const handleShiftClick = useCallback(
        (employeeId: string, date: Date) => {
            if (!employeeId || !date) return;

            const dateStr = date.toISOString().split("T")[0];
            const existing = shifts.find(
                (s) => s?.employeeId === employeeId && s?.date === dateStr
            );

            setShiftModalData(existing || { employeeId, date: dateStr });
        },
        [shifts]
    );

    // ----------------------------------------
    // GUARDAR SHIFT
    // ----------------------------------------
    const handleSaveShift = useCallback(
        (saved: Partial<Shift> & { employeeId: string; date: string }) => {
            try {
                actions.saveShift(saved);
            } catch (e) {
                console.error("Error guardando turno:", e);
            }
            setShiftModalData(null);
        },
        [actions]
    );

    // ----------------------------------------
    // RENDER
    // ----------------------------------------
    return (
        <div className="space-y-6">
            {/* -------------------- HEADER -------------------- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">
                        Planificación 24/7
                    </h1>
                    <p className="text-slate-400">
                        Gestión segura de turnos 24/7.
                    </p>
                </div>

                {/* Selector + Fechas */}
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl">
                    {/* Unidad segura */}
                    <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="bg-white/5 rounded-lg text-slate-200 text-sm px-2 py-1"
                    >
                        {units.length === 0 && (
                            <option value="">Sin unidades</option>
                        )}

                        {units.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>

                    {/* Cambio de mes */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => changeMonth(-1)}
                            className="px-2 py-1 text-xs"
                            disabled={units.length === 0}
                        >
                            ←
                        </Button>
                        <span className="text-slate-200 font-medium w-32 text-center">
                            {currentDate.toLocaleDateString("es-ES", {
                                month: "long",
                                year: "numeric"
                            })}
                        </span>
                        <Button
                            variant="secondary"
                            onClick={() => changeMonth(1)}
                            className="px-2 py-1 text-xs"
                            disabled={units.length === 0}
                        >
                            →
                        </Button>
                    </div>
                </div>
            </div>

            {/* -------------------- GRID PRINCIPAL -------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    {/* SIN EMPLEADOS */}
                    {employees247.length === 0 && (
                        <Card className="p-8 text-center">
                            <p className="text-slate-400">
                                No hay funcionarios con modalidad 24/7 en este
                                departamento.
                            </p>
                        </Card>
                    )}

                    {/* LISTA EMPLEADOS */}
                    {employees247.map((emp) => (
                        <Card key={emp.id} className="overflow-hidden">
                            {/* HEADER EMPLEADO */}
                            <div
                                className={`p-4 border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors ${
                                    selectedEmployeeId === emp.id
                                        ? "bg-white/5"
                                        : ""
                                }`}
                                onClick={() => setSelectedEmployeeId(emp.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <SafeAvatar
                                        src={emp.avatarUrl}
                                        alt={emp.name}
                                    />

                                    <div>
                                        <h3 className="font-bold text-slate-100">
                                            {emp.name}
                                        </h3>
                                        <div className="flex gap-2 text-xs text-slate-400">
                                            <span>{emp.position}</span>
                                            <ModalityPill
                                                modality={emp.modality}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right text-xs text-slate-400">
                                    Target: {emp.weekly_target_hours ?? "?"}
                                    h/sem
                                </div>
                            </div>

                            {/* HEADERS DÍAS */}
                            <div className="grid grid-cols-7 gap-px bg-slate-800/50 border-b border-white/5">
                                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
                                    .map((d) => (
                                        <div
                                            key={d}
                                            className="p-2 text-center text-xs font-semibold text-slate-500 bg-slate-900/80"
                                        >
                                            {d}
                                        </div>
                                    ))}
                            </div>

                            {/* GRID DE DÍAS */}
                            <div className="grid grid-cols-7 gap-px bg-slate-800/50">
                                {/* Huecos inicio de mes */}
                                {Array.from({
                                    length: new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth(),
                                        1
                                    ).getDay()
                                }).map((_, i) => (
                                    <div
                                        key={`empty-${i}`}
                                        className="bg-slate-900/20 h-24"
                                    />
                                ))}

                                {/* DÍAS */}
                                {daysInMonth.map((day) => {
                                    const dateStr = day
                                        .toISOString()
                                        .split("T")[0];

                                    const shift = shifts.find(
                                        (s) =>
                                            s?.employeeId === emp.id &&
                                            s?.date === dateStr
                                    );

                                    const isToday =
                                        dateStr ===
                                        new Date()
                                            .toISOString()
                                            .split("T")[0];

                                    return (
                                        <DayCell
                                            key={`${emp.id}-${dateStr}`}
                                            day={day}
                                            shift={shift}
                                            isToday={isToday}
                                            onClick={() =>
                                                handleShiftClick(emp.id, day)
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* PANEL DERECHO */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="sticky top-24">
                        <h2 className="text-lg font-bold text-slate-100 mb-4">
                            Validación Semanal
                        </h2>

                        {selectedEmployeeId ? (
                            <WeeklyValidationPanel
                                employee={employees247.find(
                                    (e) => e.id === selectedEmployeeId
                                )}
                                allShifts={shifts}
                                year={currentDate.getFullYear()}
                                month={currentDate.getMonth()}
                            />
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">
                                Selecciona un funcionario para ver su
                                validación.
                            </p>
                        )}

                        {/* LEYENDA */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3">
                                Leyenda
                            </h3>

                            <div className="space-y-2 text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/50"></div>
                                    <span>Turno Diurno</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/50"></div>
                                    <span>Turno Noche</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-slate-700/30 
                                                    text-center text-[8px] 
                                                    flex items-center justify-center">
                                        L
                                    </div>
                                    <span>Día Libre</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* MODAL */}
            <ShiftModal
                isOpen={!!shiftModalData}
                onClose={() => setShiftModalData(null)}
                onSave={handleSaveShift}
                shiftData={shiftModalData}
                employees={employees}
                shifts={shifts}
            />
        </div>
    );
};

export default Planning247Page;