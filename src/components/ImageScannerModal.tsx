import React, { useState } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  X,
  Check,
  AlertCircle,
  FileImage,
  Calendar,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MonthProgram, PreachingSession } from '../data/scheduleData';
import { SPANISH_DAYS_SHORT } from '../utils/dateUtils';

interface ImageScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSessions: (sessions: PreachingSession[], monthInfo: Partial<MonthProgram>) => void;
  targetMonthKey: string;
}

export const ImageScannerModal: React.FC<ImageScannerModalProps> = ({
  isOpen,
  onClose,
  onImportSessions,
  targetMonthKey,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-4-argon' | 'gemini-3.8-flash'>('gemini-4-argon');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Option to load the default sample sheet from /assets/aistudio/...
  const handleLoadSampleSheet = async () => {
    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      // Fetch local asset directly
      const response = await fetch('/assets/aistudio/IMG-20261101-WA0012_0fd3a462.jpg');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview('/assets/aistudio/IMG-20261101-WA0012_0fd3a462.jpg');
        setImageBase64(result);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      console.error(e);
      setErrorMessage('No se pudo cargar la imagen de ejemplo.');
      setIsAnalyzing(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!imageBase64) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          targetMonth: targetMonthKey,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar la imagen en el servidor.');
      }

      const res = await response.json();
      if (res.data) {
        setAnalysisResult(res.data);
      } else {
        throw new Error('La IA no devolvió datos estructurados.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error analizando la imagen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!analysisResult || !analysisResult.sessions) return;

    const formattedSessions: PreachingSession[] = analysisResult.sessions.map((s: any, idx: number) => {
      // Auto-compute day name if missing
      const d = new Date(s.date + 'T12:00:00');
      const dayShort = !isNaN(d.getTime()) ? SPANISH_DAYS_SHORT[d.getDay()] : (s.dayName || 'lun');

      return {
        id: `imported-${Date.now()}-${idx}`,
        date: s.date || `${targetMonthKey}-01`,
        dayName: dayShort,
        time: s.time || '10:00',
        meetingPlace: s.meetingPlace || 'Por definir',
        captain: s.captain || 'Por definir',
        territory: s.territory || 'Por definir',
        territoryNumber: s.territoryNumber || 'Gral.',
        group: s.group || 'Gral.',
        type: s.type || 'presencial',
      };
    });

    onImportSessions(formattedSessions, {
      monthName: analysisResult.title || targetMonthKey,
      congregation: analysisResult.congregation || 'CONGREGACIÓN OESTE',
      campaignBanner: analysisResult.theme,
      scripture: analysisResult.scripture,
      footnote: analysisResult.notes,
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Escanear Programa con Gemini IA
              </h3>
              <p className="text-xs text-slate-500">
                Sube una foto del calendario de predicación y Gemini extraerá todas las fechas y capitanes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-6 space-y-6">
          {/* Upload Area & Sample loader */}
          {!imagePreview ? (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Haz clic para subir una foto del programa
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos JPG, PNG o fotografía tomada con el celular
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center justify-center gap-3 pt-2">
                <span className="text-xs text-slate-400 font-semibold">— O prueba con —</span>
                <button
                  type="button"
                  onClick={handleLoadSampleSheet}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>Cargar Hoja Oficial Noviembre 2026</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image Preview */}
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[360px] flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Programa subido"
                    className="w-full h-auto object-contain max-h-[360px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-indigo-600 hover:underline cursor-pointer font-semibold">
                    Cambiar fotografía
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">Imagen lista</span>
                </div>
              </div>

              {/* Analysis Trigger & Results */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Modelo de Análisis:</span>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as any)}
                      className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="gemini-4-argon">gemini-4-argon (Recomendado)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Rápido)</option>
                    </select>
                  </div>
                  <p className="text-slate-500">
                    Gemini leerá cada fila de la tabla: fecha, día, hora, lugar de reunión, capitán, territorio y grupo.
                  </p>

                  <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isAnalyzing ? 'Analizando imagen con IA...' : 'Analizar y Extraer Salidas'}</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Analysis Preview */}
                {analysisResult && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-3 max-h-[300px] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        ¡Análisis Completado!
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
                        {analysisResult.sessions?.length || 0} salidas detectadas
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 space-y-1 bg-white p-2.5 rounded-lg border border-emerald-100">
                      <p><strong>Título:</strong> {analysisResult.title || 'Programa'}</p>
                      {analysisResult.theme && <p><strong>Lema:</strong> {analysisResult.theme}</p>}
                      {analysisResult.scripture && <p><strong>Texto:</strong> {analysisResult.scripture}</p>}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-slate-600 text-[10px] uppercase">
                        Primeras salidas detectadas:
                      </span>
                      {analysisResult.sessions?.slice(0, 4).map((s: any, i: number) => (
                        <div key={i} className="bg-white p-2 rounded border border-slate-200 text-[11px]">
                          <strong>{s.date} {s.time}</strong> — {s.captain} ({s.meetingPlace})
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleConfirmImport}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Importar al Calendario</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
