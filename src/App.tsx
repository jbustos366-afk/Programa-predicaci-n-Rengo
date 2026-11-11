import React, { useState, useEffect } from 'react';
import {
  loadStoredPrograms,
  saveStoredPrograms,
  resetToDefaults,
  MonthProgram,
  PreachingSession,
} from './data/scheduleData';
import { Navbar } from './components/Navbar';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { TableView } from './components/TableView';
import { MonthManagerView } from './components/MonthManagerView';
import { GeminiChatbot } from './components/GeminiChatbot';
import { ImageScannerModal } from './components/ImageScannerModal';
import { EditSessionModal } from './components/EditSessionModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { getTodayDateString } from './utils/dateUtils';

export default function App() {
  const [programs, setPrograms] = useState<Record<string, MonthProgram>>(() =>
    loadStoredPrograms()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [currentTab, setCurrentTab] = useState<'today' | 'calendar' | 'list' | 'manage' | 'ai'>('today');

  // Today date defaults to simulated metadata time: 2026-11-11
  const todayDateStr = getTodayDateString();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSheetsSyncOpen, setIsSheetsSyncOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PreachingSession | null>(null);

  // Sync selectedMonth when selectedDate changes to a different month
  useEffect(() => {
    const monthKey = selectedDateStr.substring(0, 7);
    if (programs[monthKey] && monthKey !== selectedMonth) {
      setSelectedMonth(monthKey);
    }
  }, [selectedDateStr, programs, selectedMonth]);

  const currentProgram = programs[selectedMonth] || programs['2026-11'];

  const availableMonths = Object.keys(programs).sort();

  const handleSaveProgram = (updatedProgram: MonthProgram) => {
    const updated = {
      ...programs,
      [updatedProgram.id]: updatedProgram,
    };
    setPrograms(updated);
    saveStoredPrograms(updated);
  };

  const handleDeleteProgram = (monthKey: string) => {
    if (monthKey === '2026-11') {
      alert('El programa oficial de Noviembre 2026 no se puede eliminar.');
      return;
    }
    const copy = { ...programs };
    delete copy[monthKey];
    setPrograms(copy);
    saveStoredPrograms(copy);
    setSelectedMonth('2026-11');
  };

  const handleGoToToday = () => {
    setSelectedDateStr(todayDateStr);
    setSelectedMonth('2026-11');
    setCurrentTab('today');
  };

  const handleResetData = () => {
    if (
      confirm(
        '¿Deseas restablecer el programa oficial original de Noviembre 2026 extraído de la imagen?'
      )
    ) {
      const def = resetToDefaults();
      setPrograms(def);
      setSelectedMonth('2026-11');
      setSelectedDateStr(todayDateStr);
    }
  };

  const handleSaveSession = (updatedSession: PreachingSession) => {
    const monthKey = updatedSession.date.substring(0, 7);
    const targetProg = programs[monthKey] || currentProgram;

    const exists = targetProg.sessions.some((s) => s.id === updatedSession.id);
    let updatedSessions: PreachingSession[];

    if (exists) {
      updatedSessions = targetProg.sessions.map((s) =>
        s.id === updatedSession.id ? updatedSession : s
      );
    } else {
      updatedSessions = [...targetProg.sessions, updatedSession];
    }

    // Sort by date and time
    updatedSessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    handleSaveProgram({
      ...targetProg,
      sessions: updatedSessions,
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = currentProgram.sessions.filter((s) => s.id !== sessionId);
    handleSaveProgram({
      ...currentProgram,
      sessions: updatedSessions,
    });
  };

  const handleOpenAddModal = (prefillDate?: string) => {
    const dateToUse = prefillDate || selectedDateStr;
    const newSession: PreachingSession = {
      id: `session-${Date.now()}`,
      date: dateToUse,
      dayName: 'lun',
      time: '10:00',
      meetingPlace: '',
      captain: '',
      territory: '',
      territoryNumber: '',
      group: 'Gral.',
      type: 'presencial',
    };
    setEditingSession(newSession);
  };

  const handleSelectDayAndGoToToday = (date: string) => {
    setSelectedDateStr(date);
    setCurrentTab('today');
  };

  const handleImportSessionsFromScanner = (
    scannedSessions: PreachingSession[],
    monthInfo: Partial<MonthProgram>
  ) => {
    const targetProg = programs[selectedMonth] || currentProgram;
    const combined = [...targetProg.sessions, ...scannedSessions];
    combined.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    handleSaveProgram({
      ...targetProg,
      campaignBanner: monthInfo.campaignBanner || targetProg.campaignBanner,
      scripture: monthInfo.scripture || targetProg.scripture,
      footnote: monthInfo.footnote || targetProg.footnote,
      sessions: combined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        availableMonths={availableMonths}
        todayDateStr={todayDateStr}
        selectedDateStr={selectedDateStr}
        onGoToToday={handleGoToToday}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'today' && (
          <TodayView
            currentProgram={currentProgram}
            selectedDateStr={selectedDateStr}
            setSelectedDateStr={setSelectedDateStr}
            todayDateStr={todayDateStr}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={(session) => setEditingSession(session)}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            currentProgram={currentProgram}
            selectedDateStr={selectedDateStr}
            setSelectedDateStr={setSelectedDateStr}
            todayDateStr={todayDateStr}
            onSelectDayAndGoToToday={handleSelectDayAndGoToToday}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={(session) => setEditingSession(session)}
          />
        )}

        {currentTab === 'list' && (
          <TableView
            currentProgram={currentProgram}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={(session) => setEditingSession(session)}
            onDeleteSession={handleDeleteSession}
            onSelectDayAndGoToToday={handleSelectDayAndGoToToday}
          />
        )}

        {currentTab === 'manage' && (
          <MonthManagerView
            programs={programs}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onSaveProgram={handleSaveProgram}
            onDeleteProgram={handleDeleteProgram}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
          />
        )}

        {currentTab === 'ai' && (
          <GeminiChatbot
            currentProgram={currentProgram}
            selectedDateStr={selectedDateStr}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            Programa de Predicación • Congregación Oeste
          </p>
          <p className="text-slate-400">
            Desarrollado con datos extraídos de la hoja oficial de servicio del campo
          </p>
        </div>
      </footer>

      {/* Modals */}
      {isScannerOpen && (
        <ImageScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          targetMonthKey={selectedMonth}
          onImportSessions={handleImportSessionsFromScanner}
        />
      )}

      {isSheetsSyncOpen && (
        <GoogleSheetsSyncModal
          isOpen={isSheetsSyncOpen}
          onClose={() => setIsSheetsSyncOpen(false)}
          targetMonthKey={selectedMonth}
          onImportSessions={handleImportSessionsFromScanner}
        />
      )}

      {editingSession && (
        <EditSessionModal
          isOpen={Boolean(editingSession)}
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={handleSaveSession}
          onDelete={handleDeleteSession}
        />
      )}
    </div>
  );
}
