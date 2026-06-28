import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const InviteRedirectPage: React.FC = () => {
  const { code = '' } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the register page with the class join code pre-filled.
    // Students see the code field auto-populated so they don't have to type it manually.
    const params = new URLSearchParams({ role: 'student', classCode: code });
    navigate(`/register?${params.toString()}`, { replace: true });
  }, [code, navigate]);

  return null;
};
