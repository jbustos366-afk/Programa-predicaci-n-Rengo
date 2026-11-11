import React, { useState } from 'react';
import {
  Search,
  Filter,
  Share2,
  Printer,
  Edit3,
  Trash2,
  Check,
  Plus,
  Video,
  ExternalLink,
} from 'lucide-react';
import { MonthProgram, PreachingSession } from '../data/scheduleData';
import { formatDateSpanish } from '../utils/dateUtils';

interface TableViewProps {
  currentProgram: MonthProgram;
  onOpenAddModal: (prefillDate?: string) => void;
  onOpenEditModal: (session: PreachingSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onSelectDayAndGoToToday: (date: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  currentProgram,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteSession,
  onSelectDayAndGoToToday,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('todos');
  const [filterDay, setFilterDay] = useState('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter sessions
  const filteredSessions = currentProgram.sessions.filter((s) => {
    if (filterGroup !== 'todos' && s.group !== filterGroup) return false;
    if (filterDay !== 'todos' && s.dayName.toLowerCase() !== filterDay.toLowerCase()) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCaptain = s.captain?.toLowerCase().includes(q);
      const matchPlace = s.meetingPlace?.toLowerCase().includes(q);
      const matchTerritory = s.territory?.toLowerCase().includes(q);
      const matchTerrNumber = s.territoryNumber?.toLowerCase().includes(q);
      const matchDate = s.date?.includes(q);
      if (!matchCaptain && !matchPlace && !matchTerritory && !matchTerrNumber && !matchDate) {
        return false;
      }
    }
    return true;
  });

  const handleCopyRow = (session: PreachingSession) => {
    const text = `*PREDICACIÓN - CONGREGACIÓN OESTE*
📅 Fecha: ${session.date} (${session.dayName})
⏰ Hora: ${session.time} hrs
🏠 Lugar: ${session.meetingPlace}
👤 Capitán: ${session.captain}
📍 Territorio: ${session.territory} (${session.territoryNumber})
👥 Grupo: ${session.group}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(session.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por capitán, lugar, territorio o nº..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Group & Day filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Group */}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-500">Grupo:</span>
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

          {/* Day */}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-500">Día:</span>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos los días</option>
              <option value="lun">Lunes</option>
              <option value="mar">Martes</option>
              <option value="mié">Miércoles</option>
              <option value="jue">Jueves</option>
              <option value="vie">Viernes</option>
              <option value="sáb">Sábado</option>
              <option value="dom">Domingo</option>
            </select>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Imprimir programa o exportar a PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>

          {/* Add New Session */}
          <button
            onClick={() => onOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Salida</span>
          </button>
        </div>
      </div>

      {/* Program Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Banner matching physical sheet */}
        <div className="bg-indigo-900 text-white p-4 text-center border-b border-indigo-950">
          <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
            {currentProgram.monthName ? `PROGRAMA PREDICACIÓN: ${currentProgram.monthName.toUpperCase()}` : 'PROGRAMA PREDICACIÓN'}
          </h2>
          <p className="text-xs font-bold text-indigo-200 tracking-wider">
            {currentProgram.congregation || 'CONGREGACIÓN OESTE'}
          </p>
        </div>

        {currentProgram.campaignBanner && (
          <div className="bg-purple-800 text-white py-1.5 px-4 text-center text-xs font-extrabold tracking-wider uppercase border-b border-purple-900">
            {currentProgram.campaignBanner}
          </div>
        )}

        {/* Scrollable responsive table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-300 divide-x divide-slate-200">
                <th className="py-2.5 px-2 text-center w-14">Fecha</th>
                <th className="py-2.5 px-2 text-center w-12">Día</th>
                <th className="py-2.5 px-2 text-center w-16">Hora</th>
                <th className="py-2.5 px-3 min-w-[190px]">Lugar de Reunión</th>
                <th className="py-2.5 px-3 min-w-[150px]">Capitán Encargado</th>
                <th className="py-2.5 px-3 min-w-[210px]">Territorios</th>
                <th className="py-2.5 px-2 text-center min-w-[80px]">Nº Terr.</th>
                <th className="py-2.5 px-2 text-center w-16">Grupo</th>
                <th className="py-2.5 px-2 text-center w-24 print:hidden">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSessions.map((row, idx) => {
                const dayNum = row.date?.split('-')[2] || '';
                const isZoom = row.type === 'zoom' || row.territoryNumber?.toLowerCase().includes('zoom');
                const isAssembly = row.type === 'asamblea';
                const isAseo = row.type === 'aseo';

                // Special Assembly Row banner
                if (isAssembly) {
                  return (
                    <tr
                      key={row.id || idx}
                      className="bg-purple-100/80 hover:bg-purple-100 text-purple-950 font-bold border-y-2 border-purple-300 divide-x divide-purple-200"
                    >
                      <td className="py-2 px-2 text-center font-black">{dayNum}</td>
                      <td className="py-2 px-2 text-center uppercase">{row.dayName}</td>
                      <td className="py-2 px-2 text-center">{row.time}</td>
                      <td colSpan={5} className="py-2 px-4 text-center font-black tracking-wide">
                        {row.territory}
                      </td>
                      <td className="py-2 px-2 text-center print:hidden">
                        <button
                          onClick={() => onOpenEditModal(row)}
                          className="text-purple-700 hover:text-purple-900 font-bold"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={row.id || idx}
                    className={`hover:bg-indigo-50/50 transition-colors divide-x divide-slate-200 ${
                      isZoom
                        ? 'bg-sky-50/30'
                        : isAseo
                        ? 'bg-rose-50/40'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/60'
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-bold text-slate-900">
                      <button
                        onClick={() => onSelectDayAndGoToToday(row.date)}
                        className="hover:underline hover:text-indigo-600 cursor-pointer"
                        title="Ver en pantalla principal"
                      >
                        {dayNum}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-center uppercase font-bold text-slate-700">
                      {row.dayName}
                    </td>
                    <td className="py-2 px-2 text-center font-black text-slate-900 whitespace-nowrap">
                      {row.time}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {isZoom && <Video className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        <span className="truncate">{row.meetingPlace}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-800">
                      {row.captain}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {row.territory}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                        {row.territoryNumber}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          row.group === 'Gral.'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {row.group}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopyRow(row)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                          title="Copiar datos de esta fila"
                        >
                          {copiedId === row.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onOpenEditModal(row)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Editar fila"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSession(row.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer matching physical sheet */}
        <div className="bg-slate-100 border-t border-slate-300 p-3 text-center text-xs space-y-1">
          <p className="font-semibold text-slate-800 italic">
            {currentProgram.scripture ||
              'Salmo 9:1: "Te alabaré, oh, Jehová, con todo mi corazón; proclamare todas tus maravillosas obras"'}
          </p>
          <p className="font-bold text-slate-700">
            {currentProgram.footnote ||
              'Nota: ¡Capitán! Cuándo no pueda sacar el grupo, Por Favor busque un reemplazante con anticipación'}
          </p>
        </div>
      </div>
    </div>
  );
};
