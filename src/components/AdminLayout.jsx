import React from 'react';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      {/* MINIMAL CONTENT WRAPPER */}
      <main className="p-2 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {children}
      </main>
      
      <footer className="py-8 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        © 2026 Structural BOQ Maestro • Professional Edition
      </footer>
    </div>
  );
}
