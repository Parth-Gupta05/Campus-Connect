import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Award,
  Compass,
  Calendar,
  User,
  Users,
  GraduationCap,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const STUDENT_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/placements', label: 'Placements', icon: Award, isActive: (path) => path.startsWith('/placements') },
  { to: '/opportunities', label: 'Jobs', icon: Compass, end: true },
  { to: '/clubs', label: 'Clubs', icon: Users, isActive: (path) => path.startsWith('/clubs') },
  { to: '/events', label: 'Events', icon: Calendar, end: true },
  { to: '/certificates', label: 'Certs', icon: GraduationCap, end: true },
];

const CLUB_ITEMS = [
  { to: '/club', label: 'Portal', icon: LayoutDashboard, isActive: (path) => path.startsWith('/club') },
];

function NavItem({ to, label, icon: Icon, end, isActive: isActiveFn }) {
  const location = useLocation();
  const isMatch = isActiveFn ? isActiveFn(location.pathname) : null;

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const active = isMatch !== null ? isMatch : isActive;
        return `flex flex-col items-center justify-center gap-0.5 min-w-[4.25rem] px-2 py-1 rounded-md transition-colors shrink-0 ${
          active ? 'text-gray-1000' : 'text-gray-600 hover:text-gray-1000'
        }`;
      }}
    >
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </NavLink>
  );
}

export default function MobileStudentNav() {
  const { user } = useContext(AuthContext);

  if (!user || user.role === 'admin') return null;

  const items = user.role === 'club' ? CLUB_ITEMS : STUDENT_ITEMS;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-400 bg-background-100/95 backdrop-blur-md mobile-bottom-nav"
      aria-label="Primary navigation"
    >
      <div className="flex items-stretch h-14 overflow-x-auto no-scrollbar px-1">
        {items.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
