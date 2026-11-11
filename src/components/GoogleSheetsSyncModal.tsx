import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  LogOut,
  FolderOpen,
  Link as LinkIcon,
  ExternalLink,
  Table,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import {
  signInWithGoogle,
  signOutGoogle,
  initAuthListener,
  getAccessToken,
} from '../services/googleAuth';
import {
  listUserSpreadsheets,
  getSpreadsheetDetails,
  getSheetValues,
  parseSheetDataToSessions,
  extractSpreadsheetId,
  DriveSpreadsheetFile,
  SheetTabInfo,
} from '../services/googleSheets';
import { PreachingSession, MonthProgram } from '../data/scheduleData';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonthKey: string;
  onImportSessions: (sessions: PreachingSession[], monthInfo: Partial<MonthProgram>) => void;
}

const LAST_SYNCED_SHEET_KEY = 'congregacion_oeste_last_sheet_id';

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  targetMonthKey,
  onImportSessions,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Spreadsheets list from Drive
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Selected spreadsheet & tabs
  const [selectedSheetId, setSelectedSheetId] = useState<string>(() => {
    return localStorage.getItem(LAST_SYNCED_SHEET_KEY) || '';
  });
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState('');
  const [sheetTabs, setSheetTabs] = useState<SheetTabInfo[]>([]);
  const [selectedTabTitle, setSelectedTabTitle] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Preview & parsed data
  const [previewSessions, setPreviewSessions] = useState<PreachingSession[]>([]);
  const [parsedMetadata, setParsedMetadata] = useState<any>({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mode: 'browse' from Drive or 'paste' URL
  const [activeMode, setActiveMode] = useState<'browse' | 'paste'>('browse');

  // Auth listener
  useEffect(() => {
    const unsubscribe = initAuthListener(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Drive files when token is available
  useEffect(() => {
    if (accessToken && isOpen) {
      loadDriveFiles(accessToken);
    }
  }, [accessToken, isOpen]);

  const loadDriveFiles = async (token: string) => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const files = await listUserSpreadsheets(token);
      setSpreadsheets(files);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || 'No se pudieron listar los archivos de Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        await loadDriveFiles(result.accessToken);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setCurrentUser(null);
    setAccessToken(null);
    setSpreadsheets([]);
    setSheetTabs([]);
    setPreviewSessions([]);
  };

  // When user selects a spreadsheet (from Drive list or pasted URL)
  const handleSelectSpreadsheet = async (sheetIdToLoad: string) => {
    const rawId = extractSpreadsheetId(sheetIdToLoad);
    if (!rawId) {
      setErrorMessage('Por favor ingresa un enlace o ID de Google Sheets válido.');
      return;
    }

    const token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage('Inicia sesión con Google para acceder a esta hoja.');
      return;
    }

    setSelectedSheetId(rawId);
    localStorage.setItem(LAST_SYNCED_SHEET_KEY, rawId);
    setIsLoadingDetails(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const details = await getSpreadsheetDetails(rawId, token);
      setSpreadsheetTitle(details.title);
      setSheetTabs(details.sheets);

      // Select first sheet or one matching November
      const initialTab =
        details.sheets.find((s) => s.title.toLowerCase().includes('nov') || s.title.toLowerCase().includes('2026'))?.title ||
        details.sheets[0]?.title ||
        'Hoja 1';

      setSelectedTabTitle(initialTab);
      await loadTabValues(rawId, initialTab, token);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(`No se pudo abrir la hoja: ${e.message || 'Verifica los permisos'}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadTabValues = async (sheetId: string, tabTitle: string, token: string) => {
    setIsLoadingData(true);
    setErrorMessage(null);
    try {
      const rows = await getSheetValues(sheetId, tabTitle, token);
      const parsed = parseSheetDataToSessions(rows, targetMonthKey);
      setPreviewSessions(parsed.sessions);
      setParsedMetadata({
        campaignBanner: parsed.campaignBanner,
        scripture: parsed.scripture,
        footnote: parsed.footnote,
      });
    } catch (e: any) {
      console.error(e);
      setErrorMessage(`Error al leer los datos de la pestaña "${tabTitle}": ${e.message}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    setSelectedTabTitle(newTab);
    const token = accessToken || getAccessToken();
    if (selectedSheetId && token) {
      loadTabValues(selectedSheetId, newTab, token);
    }
  };

  const handleConfirmSync = () => {
    if (previewSessions.length === 0) {
      setErrorMessage('No hay salidas detectadas para importar.');
      return;
    }

    onImportSessions(previewSessions, {
      monthName: spreadsheetTitle ? `${spreadsheetTitle} (${selectedTabTitle})` : undefined,
      campaignBanner: parsedMetadata.campaignBanner,
      scripture: parsedMetadata.scripture,
      footnote: parsedMetadata.footnote,
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setSuccessMessage('¡Información sincronizada e importada con éxito!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const filteredDriveFiles = spreadsheets.filter((f) =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Sincronizar con Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona tu archivo de Google Drive o pega el enlace para actualizar el programa de predicación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5 text-xs">
          {/* STEP 1: Google Account Authentication */}
          {!currentUser ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Conecta tu cuenta de Google
                </h4>
                <p className="text-xs text-slate-600">
                  Para poder elegir tu archivo de Google Sheets y leer el programa de predicación, inicia sesión con la cuenta de Google donde tienes tu hoja de cálculo.
                </p>
              </div>

              {/* Official Google Sign-in button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isSigningIn ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Connected User Bar */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 px-4">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-slate-800 block leading-tight">
                      {currentUser.displayName || 'Usuario Google'}
                    </span>
                    <span className="text-[11px] text-slate-500">{currentUser.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-[11px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>

              {/* STEP 2: Choose File Method Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700 text-xs">
                    ¿Cómo deseas indicarle qué archivo usar?
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveMode('browse')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        activeMode === 'browse'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      📁 Elegir de Google Drive
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMode('paste')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        activeMode === 'paste'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🔗 Pegar Enlace / ID
                    </button>
                  </div>
                </div>

                {/* MODE A: Google Drive Picker */}
                {activeMode === 'browse' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Buscar entre tus hojas de cálculo de Drive..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                      <button
                        onClick={() => accessToken && loadDriveFiles(accessToken)}
                        disabled={isLoadingFiles}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                        title="Actualizar lista de archivos"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Files list */}
                    <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                      {isLoadingFiles ? (
                        <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Cargando tus hojas de cálculo...</span>
                        </div>
                      ) : filteredDriveFiles.length > 0 ? (
                        filteredDriveFiles.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => handleSelectSpreadsheet(file.id)}
                            className={`p-2.5 px-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              selectedSheetId === file.id
                                ? 'bg-indigo-50 border-l-4 border-indigo-600'
                                : 'hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <p className="font-bold text-slate-800 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-400">ID: {file.id.substring(0, 15)}...</p>
                              </div>
                            </div>
                            {selectedSheetId === file.id ? (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                                Seleccionado ✓
                              </span>
                            ) : (
                              <button className="text-[11px] font-semibold text-indigo-600 hover:underline shrink-0">
                                Usar esta hoja
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-slate-400">
                          No se encontraron hojas de cálculo con ese nombre.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODE B: Paste URL or ID */}
                {activeMode === 'paste' && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pega el enlace completo de tu Google Sheet o el ID:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSheetInput}
                          onChange={(e) => setCustomSheetInput(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSelectSpreadsheet(customSheetInput)}
                          disabled={!customSheetInput.trim() || isLoadingDetails}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shrink-0 transition-colors"
                        >
                          {isLoadingDetails ? 'Cargando...' : 'Cargar Hoja'}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Abre tu archivo en Google Sheets en el navegador, copia la dirección de la barra superior y pégala aquí.
                    </p>
                  </div>
                )}
              </div>

              {/* STEP 3: Tab Selector & Preview */}
              {selectedSheetId && sheetTabs.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                        Hoja Conectada
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">{spreadsheetTitle}</h4>
                    </div>

                    {/* Tab dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600">Pestaña/Mes:</span>
                      <select
                        value={selectedTabTitle}
                        onChange={(e) => handleTabChange(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
                      >
                        {sheetTabs.map((tab) => (
                          <option key={tab.sheetId} value={tab.title}>
                            {tab.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-2.5 px-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">
                        Vista previa de datos ({previewSessions.length} salidas detectadas)
                      </span>
                      {isLoadingData && (
                        <span className="text-indigo-600 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Leyendo celdas...</span>
                        </span>
                      )}
                    </div>

                    <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                      {previewSessions.slice(0, 6).map((s, idx) => (
                        <div key={idx} className="p-2 px-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {s.date} {s.time}
                            </span>
                            <span className="font-bold text-slate-800 truncate">
                              🏠 {s.meetingPlace}
                            </span>
                            <span className="text-slate-500 truncate">👤 {s.captain}</span>
                          </div>
                          <span className="font-semibold text-slate-600 shrink-0">
                            Territorio {s.territoryNumber}
                          </span>
                        </div>
                      ))}
                      {previewSessions.length > 6 && (
                        <div className="p-2 text-center text-slate-400 bg-slate-50 font-medium">
                          + {previewSessions.length - 6} salidas más en esta hoja...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Sync Button */}
                  <button
                    type="button"
                    onClick={handleConfirmSync}
                    disabled={previewSessions.length === 0}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Sincronizar e Importar al Calendario ({previewSessions.length} salidas)</span>
                  </button>
                </div>
              )}

              {/* Status messages */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
