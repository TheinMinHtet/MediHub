'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Stethoscope, 
  ArrowRight, 
  RotateCcw,
  Zap
} from 'lucide-react';
import { Appointment, Doctor } from '@/lib/types';
import { fetchDoctors, createAppointment } from '@/lib/db';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    department: string;
    doctorName: string;
    slot: string;
    standardFee: number;
    insuranceDiscount: number;
    estimatedCoPay: number;
  };
}

interface AITriageConciergeProps {
  isOpen: boolean;
  onClose: () => void;
  onBookSuccess?: (appointment: Appointment) => void;
  onSelectDoctorAndProceed?: (data: {
    doctorId: string;
    doctorName: string;
    department: string;
    slot: string;
    chiefComplaint: string;
  }) => void;
}

export function AITriageConcierge({ isOpen, onClose, onBookSuccess, onSelectDoctorAndProceed }: AITriageConciergeProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Hello! I am your **FITP AI Clinical Concierge**. Please describe your symptoms or health concern in plain English or Burmese. I will analyze your case, match you to the right specialist, and check live slot availability.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookedReference, setBookedReference] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Chest tightness & rapid palpitations after morning coffee',
    'Child with 102°F fever and dry cough for 2 days',
    'Severe throbbing migraine with visual aura',
    'Knee pain and ligament swelling after football',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const renderMessageContent = (content: string) => {
    return content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#1C2A21]">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('API response failed');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI Triage error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          role: 'assistant',
          content:
            'I encountered a network issue, but based on typical clinical guidelines: If you have urgent symptoms, please select **Cardiology** or visit the Emergency Care unit.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const [dbDoctors, setDbDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    fetchDoctors().then(setDbDoctors).catch(console.error);
  }, []);

  const getDoctorIdByDept = (dept: string) => {
    const d = dept.toLowerCase();
    const match = dbDoctors.find(
      (doc) =>
        doc.department.toLowerCase().includes(d) ||
        doc.specialization.toLowerCase().includes(d)
    );
    if (match) return match.id;
    return dbDoctors[0]?.id || 'doc-1';
  };

  // Traditional OPD Architecture: Reserves appointment slot with status 'Scheduled'.
  // Queue Token is generated at Reception Counter upon physical Check-In.
  const handleReserveAppointment = async (metadata: NonNullable<Message['metadata']>) => {
    try {
      const docId = getDoctorIdByDept(metadata.department);
      const refNumber = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Save directly to Supabase database!
      const newApt = await createAppointment({
        patientName: 'Arthur Pendelton',
        dob: '1984-06-12',
        gender: 'Male',
        phone: '+95 9 4210 9921',
        nrc: '12/DAGAMA(N)049281',
        chiefComplaint: 'Matched via AI Triage: ' + metadata.department,
        doctorId: docId,
        appointmentDate: '2026-09-14',
        timeSlot: metadata.slot,
        consultationFee: metadata.standardFee,
        insuranceDiscount: metadata.insuranceDiscount,
        finalFeePaid: metadata.estimatedCoPay,
      });

      setBookedReference(refNumber);
      if (onBookSuccess) {
        onBookSuccess(newApt);
      }
    } catch (e) {
      console.error('Error reserving appointment from AI:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1C2A21]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-[640px] max-h-[90vh] ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header */}
        <div className="p-5 bg-white border-b border-[#E0E7E1] flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#EAF5EC] via-white to-[#EAF5EC] opacity-50" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5A7C65] to-[#3D5A47] flex items-center justify-center text-white shadow-lg shadow-[#5A7C65]/20">
              <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold tracking-tight text-[#1C2A21]">
                  FITP AI Clinical Concierge
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5A7C65]/10 text-[#2F4838]">
                  Agentic Triage
                </span>
              </div>
              <p className="text-[11px] text-[#617467] font-medium mt-0.5">
                Powered by Groq Llama 3.3 &bull; ReAct Matcher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#617467] hover:text-[#1C2A21] hover:bg-[#F5F7F5] transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Stream Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-[#FAFCFB]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-[13px] leading-relaxed ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold shadow-sm border-2 border-white ${
                    isUser ? 'bg-[#3D5A47] text-white' : 'bg-gradient-to-br from-[#5A7C65] to-[#3D5A47] text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] space-y-2.5`}>
                  <div
                    className={`p-4 rounded-2xl shadow-sm text-[13px] leading-relaxed ${
                      isUser
                        ? 'bg-[#3D5A47] text-white rounded-tr-sm'
                        : 'bg-white text-[#1E2922] border border-[#E0E7E1] rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>
                  </div>

                  {/* Interactive Booking Card */}
                  {msg.metadata && (
                    <div className="bg-white border border-[#CFDDD2] rounded-2xl p-4 shadow-sm space-y-3.5 animate-in fade-in-50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#EAF5EC] to-transparent opacity-50 pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-[#EBF2ED] pb-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-[#EAF5EC] rounded-lg">
                            <Stethoscope className="w-4 h-4 text-[#5A7C65]" />
                          </div>
                          <span className="font-bold text-[#1C2A21] text-xs">
                            Recommended Match
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#EBF2ED] text-[#2F4838]">
                          {msg.metadata.department}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px] relative z-10">
                        <div className="space-y-1">
                          <span className="text-[#829688] block text-[10px] font-medium uppercase tracking-wider">Doctor</span>
                          <span className="font-bold text-[#1C2A21] text-[12px]">{msg.metadata.doctorName}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[#829688] block text-[10px] font-medium uppercase tracking-wider">Earliest Slot</span>
                          <span className="font-bold text-[#1C2A21] flex items-center gap-1.5 text-[12px]">
                            <Clock className="w-3.5 h-3.5 text-[#5A7C65]" />
                            {msg.metadata.slot}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[#829688] block text-[10px] font-medium uppercase tracking-wider">Standard Fee</span>
                          <span className="font-semibold text-[#617467] text-[12px]">{msg.metadata.standardFee.toLocaleString()} MMK</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[#829688] block text-[10px] font-medium uppercase tracking-wider">Your Co-Pay</span>
                          <span className="font-extrabold text-[#1E562F] text-[13px]">
                            {msg.metadata.estimatedCoPay.toLocaleString()} MMK
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 relative z-10">
                        {bookedReference ? (
                          <div className="p-3.5 rounded-xl bg-[#EAF5EC] border border-[#BFE3C7] space-y-2 text-xs shadow-inner">
                            <div className="flex items-center gap-2 text-[#1E562F] font-bold text-sm">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              <span>Appointment Reserved ({bookedReference})</span>
                            </div>
                            <p className="text-[12px] text-[#2F4838] leading-relaxed">
                              Your slot is locked in. Please arrive at the clinic reception 10 minutes before your slot to check in and receive your <strong>Live Queue Token</strong>.
                            </p>
                            <button
                              type="button"
                              onClick={onClose}
                              className="text-[12px] font-bold text-[#1E562F] hover:text-[#174425] flex items-center gap-1 mt-2 group"
                            >
                              View Confirmed Voucher 
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const docId = getDoctorIdByDept(msg.metadata!.department);
                              const lastUserMsg =
                                [...messages].reverse().find((m) => m.role === 'user')?.content ||
                                'Triaged via AI Concierge: ' + msg.metadata!.department;
                              if (onSelectDoctorAndProceed) {
                                onSelectDoctorAndProceed({
                                  doctorId: docId,
                                  doctorName: msg.metadata!.doctorName,
                                  department: msg.metadata!.department,
                                  slot: msg.metadata!.slot,
                                  chiefComplaint: lastUserMsg,
                                });
                              } else {
                                handleReserveAppointment(msg.metadata!);
                              }
                            }}
                            className="w-full py-3 bg-[#5A7C65] hover:bg-[#486552] text-white text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Apply Recommendation &amp; Proceed</span>
                            <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-[13px] text-[#617467] bg-white p-3.5 rounded-2xl border border-[#E0E7E1] shadow-sm w-fit animate-in fade-in slide-in-from-bottom-2">
              <Bot className="w-5 h-5 text-[#5A7C65] animate-bounce" />
              <span className="font-medium">Thinking &amp; analyzing symptoms...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="bg-white border-t border-[#E0E7E1] p-4 flex flex-col gap-3 relative z-20">
          {messages.length <= 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-[#829688] shrink-0 flex items-center gap-1 bg-[#F5F7F5] px-2 py-1 rounded-md">
                <Zap className="w-3 h-3 text-[#5A7C65]" /> Try
              </span>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-[#2F4838] bg-[#F5F7F5] hover:bg-[#EAF5EC] border border-[#E0E7E1] hover:border-[#BFE3C7] whitespace-nowrap transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5 relative"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptoms (e.g. chest pain, fever, joint ache)..."
                className="w-full pl-5 pr-12 py-3.5 bg-[#F9FAF9] border border-[#E0E7E1] rounded-2xl text-[13px] text-[#1C2A21] focus:bg-white focus:ring-4 focus:ring-[#5A7C65]/10 focus:border-[#5A7C65] outline-none placeholder:text-[#829688] transition-all shadow-inner"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#5A7C65] to-[#3D5A47] hover:from-[#486552] hover:to-[#2F4838] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
              title="Send symptom query"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
