import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ListFilter,
  PlusCircle,
  Sparkles,
  Camera,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import { getMonthDisplayName } from '../utils/dateUtils';

interface NavbarProps {
  currentTab: 'today' | 'calendar' | 'list' | 'manage' | 'ai';
  setCurrentTab: (tab: 'today' | 'calendar' | 'list' | 'manage' | 'ai') => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  todayDateStr: string;
  selectedDateStr: string;
  onGoToToday: () => void;
  onOpenScanner: () => void;
  onOpenSheetsSync: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  todayDateStr,
  selectedDateStr,
  onGoToToday,
  onOpenScanner,
  onOpenSheetsSync,
  onResetData,
}) => {
  const isViewingToday = selectedDateStr === todayDateStr;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Logo & Congregación */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  Programa de Predicación
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Congregación Oeste
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                Servicio del campo, asignación de territorios y capitanes de grupo
              </p>
            </div>
          </div>

          {/* Controls: Month Selector & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Month select dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold py-2 pl-3 pr-8 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
                aria-label="Seleccionar mes"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {getMonthDisplayName(m)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Quick Go to Today button */}
            <button
              onClick={onGoToToday}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                isViewingToday && currentTab === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
              title="Ver el programa del día de hoy"
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Hoy</span>
            </button>

            {/* Google Sheets Trigger */}
            <button
              onClick={onOpenSheetsSync}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
              title="Sincronizar programa con Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets</span>
              <span className="sm:hidden">Sheets</span>
            </button>

            {/* AI Scanner Trigger */}
            <button
              onClick={onOpenScanner}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
              title="Escanear foto de un nuevo programa con IA"
            >
              <Camera className="w-4 h-4" />
              <span>Escanear Foto</span>
            </button>

            {/* Reset data */}
            <button
              onClick={onResetData}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Restaurar programa oficial original de Noviembre 2026"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-100 py-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentTab('today')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'today'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hoy en Predicación</span>
            {isViewingToday && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'calendar'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendario Mensual</span>
          </button>

          <button
            onClick={() => setCurrentTab('list')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'list'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Lista Completa (Tabla)</span>
          </button>

          <button
            onClick={() => setCurrentTab('manage')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'manage'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Añadir / Próximo Mes</span>
          </button>

          <button
            onClick={() => setCurrentTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'ai'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs font-semibold'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Asistente IA</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
