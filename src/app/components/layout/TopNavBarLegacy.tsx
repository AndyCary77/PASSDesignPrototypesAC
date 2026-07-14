import React from 'react';
import { Link, useLocation } from 'react-router';
import logo from "figma:asset/a8dcce14c232a2c900b6362fb6c2b322188e1200.png";
import {
  Users, UserCheck, Calendar, Briefcase, PoundSterling, BarChart2,
  AlertTriangle, MessageSquare, Clock, HelpCircle,
  Settings, MoreHorizontal, User, CheckCircle
} from 'lucide-react';
import { useScrolled } from '../../hooks/useScrolled';

export function Header() {
  const location = useLocation();
  const scrolled = useScrolled();

  return (
    <header className={`flex flex-col w-full text-white transition-transform duration-300 ${scrolled ? '-translate-y-full' : 'translate-y-0'}`}>
      {/* Top System Bar */}
      <div className="bg-[#6d1b98] h-12 flex items-center justify-between px-4 text-xs font-medium">
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/">
            <img src={logo} alt="PASS Logo" className="h-8 w-auto shrink-0" />
          </Link>
        </div>
        
        <nav className="flex items-center gap-6 h-full">
          <NavItem 
            icon={<Users className="w-4 h-4" />} 
            label="Customers" 
            to="/customers"
            active={['/', '/customers', '/customers/details'].includes(location.pathname)}
          />
          <NavItem 
            icon={<UserCheck className="w-4 h-4" />} 
            label="Employees" 
            to="/employees"
            active={location.pathname === '/employees'} 
          />
          <NavItem icon={<Briefcase className="w-4 h-4" />} label="Bookings" to="/bookings" />
          <NavItem icon={<Calendar className="w-4 h-4" />} label="Schedule" to="/schedule" active={location.pathname === '/schedule'} />
          <NavItem icon={<PoundSterling className="w-4 h-4" />} label="Finance" to="/finance" />
          <NavItem icon={<BarChart2 className="w-4 h-4" />} label="Reporting" to="/reporting" />
          <NavItem icon={<AlertTriangle className="w-4 h-4" />} label="Alerts" to="/alerts" />
          <NavItem icon={<MessageSquare className="w-4 h-4" />} label="Enquiries" to="/enquiries" />
          <NavItem icon={<Clock className="w-4 h-4" />} label="Timeline" to="/timeline" />
          
          <div className="h-4 w-px bg-purple-400 mx-2"></div>
          
          <div className="flex items-center gap-4 text-purple-200">
            <HelpCircle className="w-5 h-5 cursor-pointer hover:text-white" />

            <Settings className="w-5 h-5 cursor-pointer hover:text-white" />
            <div className="flex items-center gap-1 cursor-pointer hover:text-white">
              <MoreHorizontal className="w-5 h-5" />
              <span>More</span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavItem({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: string }) {
  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );

  const className = `flex items-center gap-1.5 cursor-pointer transition-colors px-3 h-full ${
    active 
      ? 'text-white font-semibold bg-purple-950' 
      : 'text-purple-100 hover:text-white hover:bg-white/10'
  }`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}