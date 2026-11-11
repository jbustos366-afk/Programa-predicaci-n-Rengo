import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  UserCheck,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Video,
  Users,
  Compass,
  Check,
  Edit3,
  Plus,
  BookOpen,
  Info,
} from 'lucide-react';
import { PreachingSession, MonthProgram } from '../data/scheduleData';
import { formatDateSpanish, SPANISH_DAYS_SHORT } from '../utils/dateUtils';

interface TodayViewProps {
  currentProgram: MonthProgram;
  selectedDateStr: string;
  setSelectedDateStr: (date: string) => void;
  todayDateStr: string;
  onOpenAddModal: (prefillDate?: string) => void;
  onOpenEditModal: (session: PreachingSession) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentProgram,
  selectedDateStr,
  setSelectedDateStr,
  todayDateStr,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // Filter sessions for selected date
  const sessionsForDate = currentProgram.sessions.filter(
    (s) => s.date === selectedDateStr
  );

  const isToday = selectedDateStr === todayDateStr;

  // Generate a week slice around the selected date
  const selectedDateObj = new Date(selectedDateStr + 'T12:00:00');
  const weekDays = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${day}`;
    const dayShort = SPANISH_DAYS_SHORT[d.getDay()];
    const count = currentProgram.sessions.filter((s) => s.date === dateKey).length;
    return {
      dateKey,
      dayNum: d.getDate(),
      dayShort,
      count,
      isToday: dateKey === todayDateStr,
      isSelected: dateKey === selectedDateStr,
    };
  });

  const handlePrevDay = () => {
    const d = new Date(selectedDateStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${day}`);
  };

  const handleShareWhatsApp = (session: PreachingSession) => {
    const text = `*PROGRAMA DE PREDICACIÓN - CONGREGACIÓN OESTE*
📅 *Fecha:* ${formatDateSpanish(session.date)}
⏰ *Hora:* ${session.time} hrs
🏠 *Lugar de Reunión:* ${session.meetingPlace}
👤 *Capitán Encargado:* ${session.captain}
📍 *Territorios:* ${session.territory}
🗺️ *Nº Territorio:* ${session.territoryNumber}
👥 *Grupo asignado:* ${session.group}
${session.notes ? `📝 *Nota:* ${session.notes}\n` : ''}
_${currentProgram.scripture || 'Salmo 9:1'}_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSessionId(session.id);
      setTimeout(() => setCopiedSessionId(null), 2500);
    }
  };

  const handleOpenMaps = (query: string) => {
    const encoded = encodeURIComponent(`${query}, Rengo, Chile`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Campaign Banner if present */}
      {currentProgram.campaignBanner && (
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-indigo-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-purple-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-purple-200">
                Campaña Especial Noviembre 2026
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentProgram.campaignBanner}
              </h2>
            </div>
          </div>
          <div className="text-xs text-purple-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-medium">
            Congregación Oeste
          </div>
        </div>
      )}

      {/* Main Today / Day Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Date Header Strip */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-sky-600 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isToday ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    HOY EN CURSO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Día Seleccionado
                  </span>
                )}
                <span className="text-xs text-indigo-100/80">
                  {sessionsForDate.length} {sessionsForDate.length === 1 ? 'salida programada' : 'salidas programadas'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight capitalize">
                {formatDateSpanish(selectedDateStr)}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 mt-1">
                Consulta los puntos de reunión, capitanes de turno y territorios asignados.
              </p>
            </div>

            {/* Quick date navigators */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handlePrevDay}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors border border-white/20"
                title="Día anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <label className="relative cursor-pointer bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-white/20 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Elegir Fecha</span>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => e.target.value && setSelectedDateStr(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>

              <button
                onClick={handleNextDay}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors border border-white/20"
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick 7-Day Navigation Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between sm:justify-center gap-2 min-w-max">
            {weekDays.map((w) => (
              <button
                key={w.dateKey}
                onClick={() => setSelectedDateStr(w.dateKey)}
                className={`flex flex-col items-center py-2 px-3 sm:px-4 rounded-xl text-center transition-all ${
                  w.isSelected
                    ? 'bg-indigo-600 text-white shadow-md font-bold scale-105'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  {w.dayShort}
                </span>
                <span className="text-base sm:text-lg font-extrabold">{w.dayNum}</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  {w.count > 0 ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                        w.isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {w.count}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-300">-</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {sessionsForDate.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {sessionsForDate.map((session, idx) => {
                const isZoom = session.type === 'zoom' || session.territoryNumber?.toLowerCase().includes('zoom');
                const isAssembly = session.type === 'asamblea';
                const isCleaning = session.type === 'aseo';
                const isPublic = session.type === 'publica';

                return (
                  <div
                    key={session.id || idx}
                    className={`rounded-2xl border transition-all hover:shadow-md overflow-hidden flex flex-col justify-between ${
                      isAssembly
                        ? 'border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50/30'
                        : isCleaning
                        ? 'border-rose-300 bg-gradient-to-br from-rose-50 via-white to-rose-50/30'
                        : isZoom
                        ? 'border-sky-300 bg-gradient-to-br from-sky-50 via-white to-sky-50/30'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      {/* Session Header Badge */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black ${
                              isAssembly
                                ? 'bg-purple-600 text-white'
                                : isCleaning
                                ? 'bg-rose-600 text-white'
                                : isZoom
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {session.time} hrs
                          </span>

                          {/* Session Type */}
                          {isZoom && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                              <Video className="w-3 h-3" />
                              Predicación por Zoom
                            </span>
                          )}
                          {isPublic && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Compass className="w-3 h-3" />
                              Predicación Pública
                            </span>
                          )}
                          {isAssembly && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              <ShieldCheck className="w-3 h-3" />
                              Asamblea Regional
                            </span>
                          )}
                          {isCleaning && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              Aseo Salón del Reino
                            </span>
                          )}
                        </div>

                        {/* Group Badge */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>Grupo: {session.group}</span>
                        </div>
                      </div>

                      {/* Detail Fields in clean grid */}
                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Lugar de Reunión */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Lugar de Reunión
                            </span>
                            <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {session.meetingPlace}
                            </p>
                          </div>
                        </div>

                        {/* Capitán Encargado */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Capitán Encargado
                            </span>
                            <p className="text-sm sm:text-base font-bold text-slate-900">
                              {session.captain}
                            </p>
                          </div>
                        </div>

                        {/* Territorios & Nº Territorio */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                          <div className="sm:col-span-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Territorios / Ubicación
                            </span>
                            <p className="text-sm font-semibold text-slate-800">
                              {session.territory}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Nº Territorio
                            </span>
                            <span className="inline-block mt-0.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {session.territoryNumber}
                            </span>
                          </div>
                        </div>

                        {/* Notes if any */}
                        {session.notes && (
                          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{session.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* WhatsApp share */}
                        <button
                          onClick={() => handleShareWhatsApp(session)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            copiedSessionId === session.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title="Copiar texto con formato para compartir en WhatsApp"
                        >
                          {copiedSessionId === session.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Compartir WhatsApp</span>
                            </>
                          )}
                        </button>

                        {/* Maps link */}
                        {!isZoom && !isAssembly && (
                          <button
                            onClick={() => handleOpenMaps(session.meetingPlace)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="Buscar dirección en Google Maps"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                            <span>Mapa</span>
                          </button>
                        )}
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => onOpenEditModal(session)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                        title="Modificar esta salida"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 px-4 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No hay salidas registradas para este día
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4">
                Puedes agregar una nueva salida o cambiar de fecha usando el selector superior.
              </p>
              <button
                onClick={() => onOpenAddModal(selectedDateStr)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir salida para el {formatDateSpanish(selectedDateStr)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scriptural Text & Captains Reminder Note Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scripture */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Texto del Mes
            </span>
            <p className="text-sm font-medium text-slate-800 italic mt-0.5">
              {currentProgram.scripture ||
                'Salmo 9:1: "Te alabaré, oh, Jehová, con todo mi corazón; proclamare todas tus maravillosas obras"'}
            </p>
          </div>
        </div>

        {/* Footnote Reminder */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
              Recordatorio para Capitanes
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {currentProgram.footnote ||
                '¡Capitán! Cuándo no pueda sacar el grupo, por favor busque un reemplazante con anticipación.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
