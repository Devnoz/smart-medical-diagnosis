'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-12 px-6 border-t border-slate-200 bg-white/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="text-xl font-bold">
            <span className="text-blue-600">DermoMed</span>
            <span className="text-cyan-500"> AI</span>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            © {currentYear} DERMOMED AI. ADVANCED DERMAL DIAGNOSTICS.
          </p>
        </div>

        
        <div className="flex items-center gap-8">
          <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">Privacy Policy</a>
          <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">FDA Compliance</a>
          <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">HIPAA Security</a>
          <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
