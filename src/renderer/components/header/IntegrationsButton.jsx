import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { setCurrentPage } from '../../state/actions';

const IntegrationsButton = () => {
  const dispatch = useDispatch();

  const handleOpenIntegrations = () => {
    dispatch(setCurrentPage('Integrations'));
  };

  return (
        <div className="history-button" alt="link connections button" style={{ cursor: 'pointer' }} onClick={handleOpenIntegrations}>
          <Link size={17} color="hsl(var(--foreground))" />
        </div>

  );
};

export default IntegrationsButton;
