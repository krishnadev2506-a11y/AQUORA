import { Link, useLocation } from 'react-router-dom';
import { Droplet, Activity, Database, BrainCircuit, BarChart3, FileText } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-700/50 h-16 flex items-center px-4 md:px-8 justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/60 transition-colors">
          <Droplet className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
        <div>
          <span className="font-mono font-bold tracking-widest text-base md:text-lg text-glow text-cyan-300">
            AQUORA
          </span>
          <span className="hidden sm:block text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            Water Intelligence Command
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 md:gap-6 overflow-x-auto py-1">
        <NavLink to="/dashboard" icon={<Activity size={16} />} label="Dashboard" active={isActive('/dashboard')} />
        <NavLink to="/dataset" icon={<Database size={16} />} label="Water Data" active={isActive('/dataset')} />
        <NavLink to="/models" icon={<BrainCircuit size={16} />} label="AI Models" active={isActive('/models')} />
        <NavLink to="/predictions" icon={<BarChart3 size={16} />} label="Predictions" active={isActive('/predictions')} />
        <NavLink to="/reports" icon={<FileText size={16} />} label="Reports" active={isActive('/reports')} />
      </div>

      <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/60">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
          SYSTEM ONLINE
        </span>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-mono tracking-wider transition-all duration-200 whitespace-nowrap ${
      active
        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default Navbar;
