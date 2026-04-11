import { useState, type PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

import clsx from 'clsx';
import IconButton from '../ui/IconButton';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-neutral-800 text-neutral-50'
      : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-neutral-50',
  );

const DashboardLayout = ({ children }: PropsWithChildren) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-0 flex-1">
      <button
        type="button"
        aria-label="Close sidebar"
        className={clsx(
          'fixed inset-0 z-30 bg-black/50 md:hidden',
          sidebarOpen ? 'block' : 'hidden',
        )}
        onClick={closeSidebar}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-52 shrink-0 border-r border-neutral-800 bg-neutral-950/50 py-6 transition-transform duration-200 ease-out md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Rooms navigation"
      >
        <div className="flex items-center justify-between px-3 pb-4 md:hidden">
          <span className="text-sm font-medium text-neutral-400">Menu</span>
          <IconButton aria-label="Close sidebar" onClick={closeSidebar}>
            <span className="text-lg leading-none" aria-hidden>×</span>
          </IconButton>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <NavLink to="/rooms" className={navLinkClass} end onClick={closeSidebar}>
            <span className="text-base" aria-hidden>◉</span>
            Rooms
          </NavLink>
          {/* <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-500">
            <span className="text-base" aria-hidden>◇</span>
            Notifications <span className="text-xs">(soon)</span>
          </span> */}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
        <div className="mb-4 flex md:hidden">
          <IconButton
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="h-0.5 w-4 bg-current" />
              <span className="h-0.5 w-4 bg-current" />
              <span className="h-0.5 w-4 bg-current" />
            </span>
          </IconButton>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
