const fs = require('fs');

const path = 'src/app/admin/attendance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = `<div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            <span>{errorMessage}</span>
          </div>`;

const endAnchor = `                          {status === 'Completed' && (
                            <button`;

const missingCode = `
          <button onClick={() => setErrorMessage(null)} className="text-[#991B1B] hover:bg-[#FEE2E2] p-1 rounded-md transition-colors">
             <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="1. Pending" value={pendingCount} sub="Waiting check-in" icon={Clock} badge="New" badgeColor="blue" />
          <StatCard title="2. Checked-In" value={checkedInCount} sub="In waiting area" icon={CheckCircle} badge="Ready" badgeColor="amber" />
          <StatCard title="3. Consulting" value={inConsultCount} sub="With physician" icon={Stethoscope} badge="Live" badgeColor="green" />
          <StatCard title="4. Completed" value={completedCount} sub="Clinical notes saved" icon={CheckCheck} badge="Finished" badgeColor="green" />
          <StatCard title="5. Absent" value={absentCount} sub="Filtered out of queue" icon={AlertTriangle} badge="Missed" badgeColor="red" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-[#E0E7E1] overflow-hidden shadow-sm">
        {/* Filters and Search */}
        <div className="p-6 border-b border-[#E0E7E1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Pending', 'Checked-In', 'In-Consultation', 'Completed', 'Absent'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab as any)}
                className={\`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap \${
                  statusFilter === tab
                    ? 'bg-[#5A7C65] text-white shadow-xs'
                    : 'bg-[#F5F7F5] text-[#617467] hover:bg-[#EBF2ED] hover:text-[#2F4838]'
                }\`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829688]" />
              <input
                type="text"
                placeholder="Search Patient or NRC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F5F7F5] border-transparent focus:bg-white focus:border-[#5A7C65] rounded-xl text-sm outline-none transition-all"
              />
            </div>
            <button
              onClick={() => {
                setViewAllDates(!viewAllDates);
                setTimeout(loadAppointments, 100);
              }}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all border \${
                viewAllDates ? 'bg-[#5A7C65] text-white border-[#5A7C65]' : 'bg-white text-[#617467] border-[#E0E7E1] hover:bg-[#F5F7F5]'
              }\`}
            >
              {viewAllDates ? 'Viewing All Dates' : 'Today Only'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7F5] border-b border-[#E0E7E1]">
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Token & Patient</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Physician</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Department</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Payment</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E7E1]">
              {appointments.filter(a => statusFilter === 'All' ? true : a.attendanceStatus === statusFilter).filter(a => a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.nrc.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[#617467] text-sm">No patients found.</td></tr>
              ) : (
                appointments.filter(a => statusFilter === 'All' ? true : a.attendanceStatus === statusFilter).filter(a => a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.nrc.toLowerCase().includes(searchQuery.toLowerCase())).map((apt) => {
                  const status = apt.attendanceStatus;
                  return (
                    <tr key={apt.id} className="hover:bg-[#FDFDFD] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#5A7C65] text-white flex flex-col items-center justify-center font-bold shadow-inner shrink-0">
                            <span className="text-[8px] uppercase tracking-widest opacity-80 leading-none mb-0.5">TK</span>
                            <span className="text-sm leading-none">{apt.tokenNumber || '--'}</span>
                          </div>
                          <div>
                            <p className="font-bold text-[#1C2A21] text-sm">{apt.patientName}</p>
                            <p className="text-[11px] text-[#829688] font-medium">{apt.nrc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-[#2F4838] text-sm">{apt.doctorName}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#617467] font-medium">{apt.department}</td>
                      <td className="py-4 px-6">
                        <span className={\`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border \${
                          status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          status === 'In-Consultation' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          status === 'Checked-In' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }\`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={\`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border \${
                          apt.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }\`}>
                          {apt.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {status === 'Pending' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleCheckIn(apt.id)} className="h-8 px-2.5 bg-[#1C2A21] hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5 shrink-0">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Check-In</span>
                              </button>
                              <button onClick={() => updateAppointmentStatus(apt.id, 'Absent').then(loadAppointments)} className="h-8 px-2.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-bold rounded-lg transition-all border border-[#FCA5A5] inline-flex items-center gap-1.5 shrink-0">
                                <X className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>
                            </div>
                          )}
                          {status === 'Checked-In' && (
                            <button onClick={() => undoAppointmentCheckIn(apt.id)} className="h-8 px-2.5 bg-white hover:bg-[#F5F7F5] text-[#617467] text-[11px] font-bold rounded-lg transition-all border border-[#E0E7E1] shadow-xs inline-flex items-center gap-1.5 shrink-0">
                              <RotateCcw className="w-3 h-3" />
                              <span>Undo</span>
                            </button>
                          )}
                          {status === 'In-Consultation' && (
                            <div className="flex items-center gap-2">
                              <span className="h-8 px-2.5 inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 text-xs font-bold rounded-lg border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>In Room</span>
                              </span>
                            </div>
                          )}

`;

// We replace everything between anchor and endAnchor with anchor + missingCode + endAnchor

const regex = /<div className="flex items-center gap-2">\s*<AlertCircle className="w-4 h-4 text-\[#DC2626\]" \/>\s*<span>\{errorMessage\}<\/span>\s*<\/div>[\s\S]*?\{status === 'Completed' && \(\s*<button/g;

if (regex.test(content)) {
  content = content.replace(regex, anchor + missingCode + endAnchor);
  fs.writeFileSync(path, content);
  console.log("RESTORED");
} else {
  console.log("NOT FOUND");
}
