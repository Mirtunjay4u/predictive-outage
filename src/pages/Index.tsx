import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Always land on login page first for demo purposes
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
}
