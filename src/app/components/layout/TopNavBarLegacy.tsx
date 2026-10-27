import React from 'react';
import { Link, useLocation } from 'react-router';
import logo from "figma:asset/a8dcce14c232a2c900b6362fb6c2b322188e1200.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faUserGroup, faCalendarCheck, faCalendarDays, faChartLine,
  faFileLines, faTriangleExclamation, faComment, faHourglassHalf,
  faQuestion, faPen, faBars,
} from '@fortawesome/free-solid-svg-icons';
import { useScrolled } from '../../hooks/useScrolled';
import { NavModeToggle } from './NavModeToggle';
import passgeniusWhiteUrl from '../icons/passgenius-white.svg';

export function Header() {
  const location = useLocation();
  const scrolled = useScrolled();

  return (
    <header className={`flex flex-col w-full text-white transition-transform duration-300 ${scrolled ? '-translate-y-full' : 'translate-y-0'}`}>
      {/* Top System Bar */}
      <div className="bg-[#6d1b98] h-12 flex items-center justify-between px-4 text-body font-semibold">
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/">
            <img src={logo} alt="PASS Logo" className="h-8 w-auto shrink-0" />
          </Link>
        </div>

        <nav className="flex items-center gap-4 h-full">
          {/* Flush against each other — no gap between tabs, just each
              one's own padding — matching the real legacy nav's tab-bar
              look rather than separately-spaced buttons. */}
          <div className="flex items-center h-full">
            <NavItem
              icon={<FontAwesomeIcon icon={faUser} className="w-4 h-4" />}
              label="Customers"
              to="/customers/list"
              active={['/', '/customers', '/customers/details'].includes(location.pathname)}
            />
            <NavItem
              icon={<FontAwesomeIcon icon={faUserGroup} className="w-4 h-4" />}
              label="Employees"
              to="/employees/list"
              active={location.pathname.startsWith('/employees')}
            />
            <NavItem icon={<FontAwesomeIcon icon={faCalendarCheck} className="w-4 h-4" />} label="Bookings" to="/bookings" active={location.pathname === '/bookings'} />
            <NavItem icon={<FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />} label="Schedule" to="/schedule" active={location.pathname === '/schedule'} />
            <NavItem icon={<FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />} label="Finance" to="/finance" />
            <NavItem icon={<FontAwesomeIcon icon={faFileLines} className="w-4 h-4" />} label="Reporting" to="/reporting" />
            <NavItem icon={<FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4" />} label="Alerts" to="/alerts" />
            <NavItem icon={<FontAwesomeIcon icon={faComment} className="w-4 h-4" />} label="Enquiries" to="/enquiries" active={location.pathname.startsWith('/enquiries')} />
            <NavItem icon={<FontAwesomeIcon icon={faHourglassHalf} className="w-4 h-4" />} label="Timeline" to="/timeline" />
            <NavItem label="Admin" to="/admin" active={location.pathname === '/admin'} />
          </div>

          <div className="h-4 w-px bg-purple-400"></div>

          <div className="flex items-center gap-3 text-white">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#dfa5ff] cursor-pointer hover:bg-[#e9bdff] transition-colors">
              <FontAwesomeIcon icon={faQuestion} className="w-2.5 h-2.5 text-[#6d1b98]" />
            </span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#dfa5ff] cursor-pointer hover:bg-[#e9bdff] transition-colors">
              <FontAwesomeIcon icon={faPen} className="w-2.5 h-2.5 text-[#6d1b98]" />
            </span>
            {/* White PASSgenius mark — the variant actually built for a dark
                background like this bar (defaults to white fill, animates
                to the brand gradient on hover), unlike the purple variant
                used on the light CareBridge draft panels elsewhere. No
                circular backing (unlike Help/Pen either side of it) — the
                mark reads as its own brand icon, not another plain nav
                button. */}
            <span className="flex items-center justify-center w-6 h-6 cursor-pointer">
              <object type="image/svg+xml" data={passgeniusWhiteUrl} className="w-6 h-6 pointer-events-none" aria-label="PASSgenius" tabIndex={-1} />
            </span>
            {/* Sits right before More — lets someone switch back to the new
                side-nav layout without disrupting anyone who's deliberately
                opted into this one. */}
            <NavModeToggle variant="dark" current="legacy" />
            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
              <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
              <span>More</span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavItem({ icon, label, active, to }: { icon?: React.ReactNode; label: string; active?: boolean; to?: string }) {
  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );

  const className = `flex items-center gap-1.5 cursor-pointer transition-colors px-3 h-full text-white ${
    active ? 'font-bold bg-purple-950' : 'hover:bg-white/10'
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