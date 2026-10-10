const fs = require('fs');
let content = fs.readFileSync('src/components/patient/AITriageConcierge.tsx', 'utf8');

const startStr = '        {/* Chat Stream Body */}';
const endStr = '  );\n}';

const startIdx = content.indexOf(startStr);
const endIdx = content.lastIndexOf('  );');

if (startIdx === -1 || endIdx === -1) {
  console.log("NOT FOUND", startIdx, endIdx);
  process.exit(1);
}

const newContent = content.substring(0, startIdx) + `        {/* Chat Stream Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-[#FAFCFB]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={\`flex gap-3 text-[13px] leading-relaxed \${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }\`}
              >
                {/* Avatar */}
                <div
                  className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold shadow-sm border-2 border-white \${
                    isUser ? 'bg-[#3D5A47] text-white' : 'bg-gradient-to-br from-[#5A7C65] to-[#3D5A47] text-white'
                  }\`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={\`max-w-[85%] space-y-2.5\`}>
                  <div
                    className={\`p-4 rounded-2xl shadow-sm text-[13px] leading-relaxed \${
                      isUser
                        ? 'bg-[#3D5A47] text-white rounded-tr-sm'
                        : 'bg-white text-[#1E2922] border border-[#E0E7E1] rounded-tl-sm'
                    }\`}
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
    </div>\n` + content.substring(endIdx);

fs.writeFileSync('src/components/patient/AITriageConcierge.tsx', newContent);
console.log('DONE');
