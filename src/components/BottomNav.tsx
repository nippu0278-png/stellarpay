import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    const baseClass = "flex flex-col items-center justify-center p-2 rounded-lg transition-all active:scale-95";
    if (isActive) {
      return `${baseClass} text-primary font-bold`;
    }
    return `${baseClass} text-[#ccc3d8]`;
  };

  const getIconStyle = (path: string) => {
    const isActive = location.pathname === path;
    return isActive ? { fontVariationSettings: "'FILL' 1" } : undefined;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-[#32353c]/80 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
      <Link className={getLinkClass('/dashboard')} to="/dashboard">
        <span className="material-symbols-outlined" style={getIconStyle('/dashboard')}>home</span>
        <span className="font-label-sm text-[10px] mt-1">Home</span>
      </Link>
      
      <Link className={getLinkClass('/send')} to="/send">
        <span className="material-symbols-outlined" style={getIconStyle('/send')}>send</span>
        <span className="font-label-sm text-[10px] mt-1">Send</span>
      </Link>
      
      <Link className={getLinkClass('/rewards')} to="/rewards">
        <span className="material-symbols-outlined" style={getIconStyle('/rewards')}>star</span>
        <span className="font-label-sm text-[10px] mt-1">Rewards</span>
      </Link>
      
      <Link className={getLinkClass('/explorer')} to="/explorer">
        <span className="material-symbols-outlined" style={getIconStyle('/explorer')}>search</span>
        <span className="font-label-sm text-[10px] mt-1">Explore</span>
      </Link>
      
      <Link className={getLinkClass('/settings')} to="/settings">
        <span className="material-symbols-outlined" style={getIconStyle('/settings')}>settings</span>
        <span className="font-label-sm text-[10px] mt-1">Settings</span>
      </Link>
    </nav>
  );
};
