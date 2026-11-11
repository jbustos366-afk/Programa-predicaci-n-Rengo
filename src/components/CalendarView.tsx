import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Clock,
  MapPin,
  UserCheck,
  Video,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { MonthProgram, PreachingSession } from '../data/scheduleData';
import { SPANISH_DAYS_FULL, formatDateSpanish, getMonthDisplayName } from '../utils/dateUtils';

interface CalendarViewProps {
  currentProgram: MonthProgram;
  selectedDateStr: string;
  setSelectedDateStr: (date: string) => void;
  todayDateStr: string;
  onSelectDayAndGoToToday: (date: string) => void;
  onOpenAddModal: (prefillDate?: string) => void;
  onOpenEditModal: (session: PreachingSession) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentProgram,
  selectedDateStr,
  setSelectedDateStr,
  todayDateStr,
  onSelectDayAndGoToToday,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('todos');
  const [filterType, setFilterType] = useState<string>('todos');

  // Month and year from currentProgram
  const year = currentProgram.year || 2026;
  const month = currentProgram.monthIndex || 11; // 1-indexed

  // Calculate days in month
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // Day of week of the 1st day (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  // Adjust so Monday is 0 and Sunday is 6
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Calendar cells: empty padding days + actual days
  const calendarDays = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    calendarDays.push(d);
  }

  // Filter sessions
  const filteredSessions = currentProgram.sessions.filter((s) => {
    if (filterGroup !== 'todos' && s.group !== filterGroup) return false;
    if (filterType !== 'todos') {
      if (filterType === 'zoom' && s.type !== 'zoom') return false;
      if (filterType === 'presencial' && s.type !== 'presencial') return false;
      if (filterType === 'publica' && s.type !== 'publica') return false;
      if (filterType === 'asamblea' && s.type !== 'asamblea') return false;
    }
    return true;
  });

  const getSessionsForDay = (day: number) => {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredSessions.filter((s) => s.date === dayStr);
  };

  const selectedDaySessions = currentProgram.sessions.filter(
    (s) => s.date === selectedDateStr
  );

  return (
    <div className="space-y-6">
      {/* Calendar Header with Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {getMonthDisplayName(currentProgram.id)}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentProgram.sessions.length} salidas en total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Haz clic en cualquier día para ver el detalle completo o programar una salida
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter by Group */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Grupo:</span>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="Gral.">Gral.</option>
              <option value="1 y 2">1 y 2</option>
              <option value="3 y 4">3 y 4</option>
              <option value="5 y 6">5 y 6</option>
            </select>
          </div>

          {/* Filter by Type */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">Modalidad:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todas</option>
              <option value="presencial">Presencial</option>
              <option value="zoom">Zoom</option>
              <option value="publica">Pública</option>
              <option value="asamblea">Asamblea</option>
            </select>
          </div>

          {/* Add button */}
          <button
            onClick={() => onOpenAddModal(selectedDateStr)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Salida</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Days of Week Header (Lun - Dom) */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-3 text-xs font-black text-slate-700 uppercase tracking-wider">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div className="text-indigo-600">Sáb</div>
          <div className="text-indigo-600">Dom</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[90px] sm:min-h-[110px]" />;
            }

            const dayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dayDateStr === todayDateStr;
            const isSelected = dayDateStr === selectedDateStr;
            const daySessions = getSessionsForDay(day);

            // Assembly check (Nov 20, 21, 22)
            const isAssemblyDay = daySessions.some((s) => s.type === 'asamblea');

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDateStr(dayDateStr)}
                className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/90 ring-2 ring-indigo-600 ring-inset z-10'
                    : isToday
                    ? 'bg-emerald-50/60 hover:bg-emerald-50'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-800'
                    }`}
                  >
                    {day}
                  </span>

                  {isToday && (
                    <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-700 uppercase">
                      Hoy
                    </span>
                  )}
                </div>

                {/* Day Sessions Badges */}
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {isAssemblyDay ? (
                    <div className="bg-purple-100 border border-purple-300 text-purple-900 rounded-md px-1.5 py-1 text-[10px] font-bold truncate">
                      🏛️ ASAMBLEA
                    </div>
                  ) : (
                    daySessions.slice(0, 3).map((session, sIdx) => {
                      const isZoom = session.type === 'zoom';
                      const isPublic = session.type === 'publica';
                      const isCleaning = session.type === 'aseo';

                      return (
                        <div
                          key={sIdx}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center justify-between gap-1 ${
                            isZoom
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : isPublic
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isCleaning
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                          title={`${session.time} - ${session.meetingPlace} (${session.captain})`}
                        >
                          <span className="truncate">{session.time} {session.captain?.split(' ')[0]}</span>
                          <span className="text-[9px] opacity-75 font-normal shrink-0">{session.group}</span>
                        </div>
                      );
                    })
                  )}

                  {daySessions.length > 3 && (
                    <div className="text-[9px] font-bold text-indigo-600 px-1">
                      +{daySessions.length - 3} más...
                    </div>
                  )}
                </div>

                {/* Hover Quick Action */}
                <div className="mt-1 pt-1 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDayAndGoToToday(dayDateStr);
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Ver detalles →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Card under the Calendar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                Salidas programadas para
              </span>
              <h3 className="text-lg font-bold text-slate-900 capitalize">
                {formatDateSpanish(selectedDateStr)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectDayAndGoToToday(selectedDateStr)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <span>Abrir en Pantalla Principal</span>
              <span>→</span>
            </button>
            <button
              onClick={() => onOpenAddModal(selectedDateStr)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Selected day session items */}
        <div className="pt-4">
          {selectedDaySessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDaySessions.map((session, i) => (
                <div
                  key={session.id || i}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all text-xs space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md font-black bg-slate-900 text-white">
                        {session.time} hrs
                      </span>
                      <span className="font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {session.group}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 truncate" title={session.meetingPlace}>
                        🏠 {session.meetingPlace}
                      </p>
                      <p className="font-medium text-slate-700">
                        👤 Capitán: <strong className="text-slate-900">{session.captain}</strong>
                      </p>
                      <p className="text-slate-600">
                        📍 {session.territory} ({session.territoryNumber})
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 capitalize">{session.type || 'presencial'}</span>
                    <button
                      onClick={() => onOpenEditModal(session)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px]"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3 text-center">
              No hay salidas en esta fecha. Haz clic en &quot;Añadir&quot; para agregar una.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
