import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  MessageSquare,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { MonthProgram } from '../data/scheduleData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiChatbotProps {
  currentProgram: MonthProgram;
  selectedDateStr: string;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentProgram,
  selectedDateStr,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy tu asistente del **Programa de Predicación de la Congregación Oeste**.\n\nTengo en memoria todo el programa de ${currentProgram.monthName || 'este mes'}: capitanes, horarios, lugares de reunión, territorios y grupos.\n\n¿En qué puedo ayudarte hoy?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    '📅 ¿Quién es el capitán hoy y a qué hora salimos?',
    '💬 Redactar aviso para WhatsApp de la salida de hoy',
    '👥 ¿Qué días le corresponde salir a los Grupos 1 y 2?',
    '📖 Sugerir un texto bíblico animador para la reunión del servicio del campo',
    '🏛️ ¿Cuáles son las fechas y horarios de la Asamblea Regional?',
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userText.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel,
          scheduleContext: {
            currentMonth: currentProgram.monthName,
            congregation: currentProgram.congregation,
            campaign: currentProgram.campaignBanner,
            scripture: currentProgram.scripture,
            selectedDate: selectedDateStr,
            sessions: currentProgram.sessions,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar el servidor.');
      }

      const data = await response.json();
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.reply || 'No recibí respuesta del asistente.',
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `⚠️ Hubo un inconveniente al conectar con el asistente de IA: ${err.message || 'Error de red'}. Por favor intenta nuevamente.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Historial reiniciado. Estoy listo para ayudarte con el programa de predicación de la Congregación Oeste.`,
      },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[700px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base">
                Asistente IA de Predicación
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                Activo
              </span>
            </div>
            <p className="text-xs text-indigo-200">
              Consultas bíblicas, capitanes, territorios y avisos de WhatsApp
            </p>
          </div>
        </div>

        {/* Model selector & reset */}
        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-white/20 focus:outline-hidden cursor-pointer"
          >
            <option value="gemini-3.8-flash" className="text-slate-900">
              gemini-3.8-flash (Rápido y Preciso)
            </option>
            <option value="gemini-3.1-flash-lite" className="text-slate-900">
              gemini-3.1-flash-lite (Ultra Rápido)
            </option>
            <option value="gemini-4-argon" className="text-slate-900">
              gemini-4-argon (Razonamiento Complejo)
            </option>
            <option value="gemini-4-carbon" className="text-slate-900">
              gemini-4-carbon (Profundo)
            </option>
          </select>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Reiniciar conversación"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2.5 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Preguntas Rápidas:
          </span>
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors whitespace-nowrap font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  isUser
                    ? 'bg-slate-800'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Copy button for assistant responses */}
                {!isUser && (
                  <button
                    onClick={() => handleCopyMessage(msg.content, index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-md transition-all"
                    title="Copiar respuesta"
                  >
                    {copiedIdx === index ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-tl-xs shadow-xs flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Consultando programa y redactando respuesta...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre capitanes, territorios, horarios o solicita un texto bíblico..."
            className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
