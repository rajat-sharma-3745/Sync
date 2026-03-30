import { useContext } from 'react';

import { UiContext } from '../context/UiContext';

export const useUi = () => {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error('useUi must be used within a UiProvider');
  }

  return ctx;
};

