import React, { useState, useEffect } from 'react';
import { X, Save, Clock, MapPin, UserCheck, Trash2 } from 'lucide-react';
import { PreachingSession } from '../data/scheduleData';
import { SPANISH_DAYS_SHORT } from '../utils/dateUtils';

interface EditSessionModalProps {
  session: PreachingSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSession: PreachingSession) => void;
  onDelete?: (sessionId: string) => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  session,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [date, setDate] = useState(session?.date || '');
  const [time, setTime] = useState(session?.time || '10:00');
  const [meetingPlace, setMeetingPlace] = useState(session?.meetingPlace || '');
  const [captain, setCaptain] = useState(session?.captain || '');
  const [territory, setTerritory] = useState(session?.territory || '');
  const [territoryNumber, setTerritoryNumber] = useState(session?.territoryNumber || '');
  const [group, setGroup] = useState(session?.group || 'Gral.');
  const [type, setType] = useState<any>(session?.type || 'presencial');
  const [notes, setNotes] = useState(session?.notes || '');

  useEffect(() => {
    if (session) {
      setDate(session.date);
      setTime(session.time);
      setMeetingPlace(session.meetingPlace);
      setCaptain(session.captain);
      setTerritory(session.territory);
      setTerritoryNumber(session.territoryNumber);
      setGroup(session.group);
      setType(session.type || 'presencial');
      setNotes(session.notes || '');
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [y, m, d] = date.split('-').map(Number);
    const dayObj = new Date(y, m - 1, d);
    const dayShort = SPANISH_DAYS_SHORT[dayObj.getDay()] || session.dayName;

    onSave({
      ...session,
      date,
      dayName: dayShort,
      time,
      meetingPlace: meetingPlace.trim(),
      captain: captain.trim(),
      territory: territory.trim(),
      territoryNumber: territoryNumber.trim(),
      group,
      type,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Editar Salida de Predicación
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                placeholder="10:00"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Lugar de Reunión
            </label>
            <input
              type="text"
              value={meetingPlace}
              onChange={(e) => setMeetingPlace(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Capitán Encargado
            </label>
            <input
              type="text"
              value={captain}
              onChange={(e) => setCaptain(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Territorios / Ubicación
              </label>
              <input
                type="text"
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
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
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Grupo</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="Gral.">Gral.</option>
                <option value="1 y 2">1 y 2</option>
                <option value="3 y 4">3 y 4</option>
                <option value="5 y 6">5 y 6</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="presencial">Presencial</option>
                <option value="zoom">Zoom</option>
                <option value="publica">Pública</option>
                <option value="asamblea">Asamblea</option>
                <option value="aseo">Aseo</option>
                <option value="censo">Censo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas u observaciones"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar esta salida?')) {
                    onDelete(session.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
