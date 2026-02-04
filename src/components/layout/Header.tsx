import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
export function Header({ onMenuClick }: {onMenuClick?: () => void;}) {
  const location = useLocation();
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Tableau de bord';
      case '/apartments':
        return 'Appartements';
      case '/bags':
        return 'Sacs';
      case '/missions':
        return 'Missions';
      case '/stock':
        return 'Stock';
      case '/agent':
        return 'Espace Agent';
      default:
        return 'ConciergeApp';
    }
  };
  return (
    <header className="flex h-16 items-center border-b bg-card px-6">
      <Button
        variant="ghost"
        size="icon"
        className="mr-4 md:hidden"
        onClick={onMenuClick}>

        <Menu className="h-5 w-5" />
      </Button>
      <h2 className="text-lg font-semibold">{getTitle()}</h2>
    </header>);

}