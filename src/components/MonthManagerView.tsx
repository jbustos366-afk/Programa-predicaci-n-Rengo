import React, { useState } from 'react';
import {
  PlusCircle,
  Calendar,
  Save,
  Trash2,
  Copy,
  Sparkles,
  FileSpreadsheet,
  Check,
  Clock,
  MapPin,
  UserCheck,
  Upload,
  Download,
  AlertCircle,
} from 'lucide-react';
import { MonthProgram, PreachingSession } from '../data/scheduleData';
import { formatDateSpanish, SPANISH_DAYS_SHORT, SPANISH_MONTHS } from '../utils/dateUtils';

interface MonthManagerViewProps {
  programs: Record<string, MonthProgram>;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onSaveProgram: (program: MonthProgram) => void;
  onDeleteProgram: (monthKey: string) => void;
  onOpenScanner: () => void;
  onOpenSheetsSync: () => void;
}

// Known common captains from the official sheet for quick suggestions
const COMMON_CAPTAINS = [
  'Lino Ávila',
  'Marco San Martín',
  'Alonso Muñoz',
  'Henry Pérez',
  'Josue Cofré',
  'Pablo Muñoz',
  'Brian Venegas',
  'Artemio Sánchez',
  'Manuel López',
  'Jorge Jaramillo',
  'Eduardo Canales N',
  'José Bustos',
  'Vicente Canales',
  'Cristian Romero',
  'José Lira',
  'Matias Cariqueo',
  'Roober Chávez',
  'Jonathan Venegas',
  'Alexander Rojas',
  'Miguel Sánchez',
  'Fernando Pérez',
  'Victor Rojas V',
  'Luis Leiva',
  'Daniel Rojas',
  'David Venegas',
  'Eduardo Canales L',
  'José Pérez',
  'Victor Rojas M',
];

const COMMON_PLACES = [
  'Av. La Piscina / Arturo Prat',
  'Familia Sanchez Muñoz (15 de Abril #50)',
  'Predicación por Zoom',
  'Egenau/ Victor Maturana',
  'Luis Chavez/ Jose Bisquertt',
  'Alfredo Garmendia/ Alejandro Karelovic',
  'Familia Venegas (Gastón Correa #1044)',
  'Plaza de Armas',
  'Familia Torrealba (Naicura o Quinta de Tilcoco #85)',
  'Hna. Laura Quezada (La Pandina # 359)',
  'San Martin/Chorrillos',
  'San Martin/ Julia Sanchez',
  'Egenau/ Fransisco Ruiz',
  'Las Industrias/ Apalta',
  'Colo Colo/ La Pandina',
  'Familia Chavez (Daniel Nilo Armijo #625)',
  'Lautaro Nte./ Egenau',
  'San Martin/ Los Olivos',
  'Colo Colo/ Victor Gallardo',
  'Gabriela Mistral/ Alexis Garrido Armijo',
  'Familia San Martín (Callejon Esmeralda #229)',
  'Egenau/ C. Julio Carrasco',
  'Familia Rojas Zambrano (Nueva C #1829)',
  'Julio Carrasco/ Mario Sanchez',
  'Ruta H-60/ Caletera Pte.',
  'Salón del Reino',
];

export const MonthManagerView: React.FC<MonthManagerViewProps> = ({
  programs,
  selectedMonth,
  setSelectedMonth,
  onSaveProgram,
  onDeleteProgram,
  onOpenScanner,
  onOpenSheetsSync,
}) => {
  const currentProgram = programs[selectedMonth] || {
    id: selectedMonth,
    monthName: selectedMonth,
    year: Number(selectedMonth.split('-')[0]),
    monthIndex: Number(selectedMonth.split('-')[1]),
    congregation: 'CONGREGACIÓN OESTE',
    sessions: [],
  };

  // Form state for adding new session
  const [sessionDate, setSessionDate] = useState(`${selectedMonth}-01`);
  const [sessionTime, setSessionTime] = useState('10:00');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [captain, setCaptain] = useState('');
  const [territory, setTerritory] = useState('');
  const [territoryNumber, setTerritoryNumber] = useState('');
  const [group, setGroup] = useState('Gral.');
  const [sessionType, setSessionType] = useState<'presencial' | 'zoom' | 'publica' | 'asamblea' | 'aseo'>('presencial');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal / state for creating a new month
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [newMonthYear, setNewMonthYear] = useState('2026');
  const [newMonthNumber, setNewMonthNumber] = useState('12');
  const [newMonthCampaign, setNewMonthCampaign] = useState('PROGRAMA REGULAR DE PREDICACIÓN');
  const [newMonthScripture, setNewMonthScripture] = useState('Salmo 9:1: "Te alabaré, oh, Jehová, con todo mi corazón"');
  const [copyTemplateFrom, setCopyTemplateFrom] = useState<'none' | 'nov2026'>('none');

  // Handle auto-detecting day name from date
  const computeDayName = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return 'lun';
    const date = new Date(y, m - 1, d);
    return SPANISH_DAYS_SHORT[date.getDay()];
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingPlace.trim() || !captain.trim()) {
      alert('Por favor completa al menos el lugar de reunión y el capitán.');
      return;
    }

    const newSession: PreachingSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: sessionDate,
      dayName: computeDayName(sessionDate),
      time: sessionTime,
      meetingPlace: meetingPlace.trim(),
      captain: captain.trim(),
      territory: territory.trim() || 'Por definir',
      territoryNumber: territoryNumber.trim() || 'Gral.',
      group,
      type: sessionType,
      notes: notes.trim() || undefined,
    };

    const updatedSessions = [...currentProgram.sessions, newSession].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    onSaveProgram({
      ...currentProgram,
      sessions: updatedSessions,
    });

    setSuccessMessage('¡Salida añadida exitosamente!');
    setTimeout(() => setSuccessMessage(''), 2500);

    // Keep date and time for easy consecutive entries, but clear specific fields
    setMeetingPlace('');
    setTerritory('');
    setTerritoryNumber('');
    setNotes('');
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta salida?')) return;
    const updated = currentProgram.sessions.filter((s) => s.id !== sessionId);
    onSaveProgram({
      ...currentProgram,
      sessions: updated,
    });
  };

  const handleDuplicateSession = (session: PreachingSession) => {
    const duplicated: PreachingSession = {
      ...session,
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...currentProgram.sessions, duplicated].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    onSaveProgram({
      ...currentProgram,
      sessions: updated,
    });
  };

  const handleCreateMonth = () => {
    const monthKey = `${newMonthYear}-${String(newMonthNumber).padStart(2, '0')}`;
    const monthName = `${SPANISH_MONTHS[Number(newMonthNumber) - 1]} ${newMonthYear}`;

    let initialSessions: PreachingSession[] = [];
    if (copyTemplateFrom === 'nov2026' && programs['2026-11']) {
      // Map November dates into the new month
      const y = Number(newMonthYear);
      const m = Number(newMonthNumber);
      initialSessions = programs['2026-11'].sessions.map((s) => {
        const origDay = s.date.split('-')[2];
        const newDate = `${y}-${String(m).padStart(2, '0')}-${origDay}`;
        return {
          ...s,
          id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: newDate,
          dayName: computeDayName(newDate),
        };
      });
    }

    const newProg: MonthProgram = {
      id: monthKey,
      monthName,
      year: Number(newMonthYear),
      monthIndex: Number(newMonthNumber),
      congregation: 'CONGREGACIÓN OESTE',
      campaignBanner: newMonthCampaign,
      scripture: newMonthScripture,
      footnote: 'Nota: ¡Capitán! Cuándo no pueda sacar el grupo, Por Favor busque un reemplazante con anticipación',
      sessions: initialSessions,
    };

    onSaveProgram(newProg);
    setSelectedMonth(monthKey);
    setShowNewMonthModal(false);
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(programs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `programa_predicacion_${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Header and Month Selector Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Gestor de Programas Mensuales
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentProgram.sessions.length} salidas registradas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Escribe o añade la información para el próximo mes (Diciembre, Enero, etc.) o sincroniza desde Google Sheets o escanea una foto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Sheets Sync Button */}
          <button
            onClick={onOpenSheetsSync}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets</span>
          </button>

          {/* Create Next Month Button */}
          <button
            onClick={() => setShowNewMonthModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Crear Próximo Mes</span>
          </button>

          {/* AI Scanner Button */}
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Escanear Foto</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Exportar copia de seguridad en JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left + Existing Sessions Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ADD SESSION FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Añadir Salida de Predicación
              </h3>
              <p className="text-xs text-slate-500">
                Mes en edición: <strong className="text-indigo-600">{currentProgram.monthName || selectedMonth}</strong>
              </p>
            </div>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleAddSession} className="space-y-4 text-xs">
            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hora</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    placeholder="10:00"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                {/* Quick hour pills */}
                <div className="flex items-center gap-1 mt-1">
                  {['08:00', '10:00', '18:00', '19:00'].map((h) => (
                    <button
                      type="button"
                      key={h}
                      onClick={() => setSessionTime(h)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                        sessionTime === h
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lugar de Reunión */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lugar de Reunión
              </label>
              <input
                type="text"
                value={meetingPlace}
                onChange={(e) => setMeetingPlace(e.target.value)}
                list="places-list"
                placeholder="Ej. Colo Colo/ Victor Gallardo, o Predicación por Zoom"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <datalist id="places-list">
                {COMMON_PLACES.map((p, i) => (
                  <option key={i} value={p} />
                ))}
              </datalist>
            </div>

            {/* Capitán Encargado */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Capitán Encargado
              </label>
              <input
                type="text"
                value={captain}
                onChange={(e) => setCaptain(e.target.value)}
                list="captains-list"
                placeholder="Ej. Marco San Martín, Josue Cofré..."
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <datalist id="captains-list">
                {COMMON_CAPTAINS.map((c, i) => (
                  <option key={i} value={c} />
                ))}
              </datalist>
            </div>

            {/* Territorios and Nº Territorio */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Territorios / Ubicación
                </label>
                <input
                  type="text"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  placeholder="Ej. Villa Valles de Rengo Etapa III"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nº Territorio
                </label>
                <input
                  type="text"
                  value={territoryNumber}
                  onChange={(e) => setTerritoryNumber(e.target.value)}
                  placeholder="21a 21b"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Grupo & Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Grupo Asignado
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Gral.">Gral. (Congregación Completa)</option>
                  <option value="1 y 2">1 y 2</option>
                  <option value="3 y 4">3 y 4</option>
                  <option value="5 y 6">5 y 6</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Modalidad / Tipo
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="presencial">Presencial (Territorio)</option>
                  <option value="zoom">Predicación por Zoom</option>
                  <option value="publica">Predicación Pública (Cesfam / Plaza)</option>
                  <option value="asamblea">Asamblea Regional</option>
                  <option value="aseo">Aseo Salón del Reino</option>
                </select>
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Notas adicionales (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Llevar folletos especiales, reunión conjunta..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar en el Calendario</span>
            </button>
          </form>
        </div>

        {/* EXISTING SESSIONS IN THIS MONTH (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Salidas registradas para {currentProgram.monthName || selectedMonth}
              </h3>
              <p className="text-xs text-slate-500">
                Puedes duplicar salidas para repetir patrones o eliminarlas
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-700">
              {currentProgram.sessions.length} salidas
            </span>
          </div>

          {currentProgram.sessions.length > 0 ? (
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {currentProgram.sessions.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {formatDateSpanish(s.date).split(',')[0]} {s.date.split('-')[2]}
                      </span>
                      <span className="font-extrabold text-indigo-700">{s.time} hrs</span>
                      <span className="font-semibold text-slate-500">{s.group}</span>
                      {s.type === 'zoom' && (
                        <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold">
                          Zoom
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 truncate" title={s.meetingPlace}>
                      🏠 {s.meetingPlace}
                    </p>
                    <p className="text-slate-600 truncate">
                      👤 {s.captain} • 📍 {s.territory} ({s.territoryNumber})
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDuplicateSession(s)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Duplicar salida"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Eliminar salida"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Este mes aún no tiene salidas programadas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Usa el formulario a la izquierda para empezar a escribir las salidas de este mes o escanea una foto del programa.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW MONTH MODAL */}
      {showNewMonthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Crear Programa para Próximo Mes
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Crea un nuevo mes para empezar a escribir los días, capitanes y lugares.
            </p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mes</label>
                  <select
                    value={newMonthNumber}
                    onChange={(e) => setNewMonthNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {SPANISH_MONTHS.map((m, idx) => (
                      <option key={idx} value={String(idx + 1)}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Año</label>
                  <input
                    type="number"
                    value={newMonthYear}
                    onChange={(e) => setNewMonthYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lema / Campaña del mes
                </label>
                <input
                  type="text"
                  value={newMonthCampaign}
                  onChange={(e) => setNewMonthCampaign(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Ej. PROGRAMA REGULAR DE PREDICACIÓN"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Texto Bíblico del mes
                </label>
                <input
                  type="text"
                  value={newMonthScripture}
                  onChange={(e) => setNewMonthScripture(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder='Mateo 28:19: "Vayan, pues, y hagan discípulos..."'
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Plantilla inicial
                </label>
                <select
                  value={copyTemplateFrom}
                  onChange={(e) => setCopyTemplateFrom(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="none">Mes en blanco (sin salidas previas)</option>
                  <option value="nov2026">
                    Copiar estructura de Noviembre 2026 (Recomendado para editar)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewMonthModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateMonth}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Crear y Visualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
