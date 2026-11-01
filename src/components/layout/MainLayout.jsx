import { ChatUnreadProvider } from '../../context/ChatUnreadContext';
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [menuOpen]);
  return (
    <ChatUnreadProvider><div className="admin-shell flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {menuOpen && <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 min-w-0 lg:ml-[260px] flex flex-col">
        <Header onMenuClick={() => setMenuOpen(value => !value)} />
        <main className="admin-content flex-1 min-w-0 p-3 sm:p-5 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px] min-w-0"><Outlet /></div>
        </main>
      </div>
    </div></ChatUnreadProvider>
  );
};

export default MainLayout;
