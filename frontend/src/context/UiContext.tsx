import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type ToastType = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface UiContextValue {
  isBusy: boolean;
  toasts: Toast[];
  setBusy: (busy: boolean) => void;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const UiContext = createContext<UiContextValue | undefined>(undefined);

const UiProvider = ({ children }: PropsWithChildren) => {
  const [isBusy, setIsBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const setBusy = useCallback((busy: boolean) => {
    setIsBusy(busy);
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<UiContextValue>(
    () => ({
      isBusy,
      toasts,
      setBusy,
      pushToast,
      dismissToast,
    }),
    [isBusy, toasts, setBusy, pushToast, dismissToast],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export { UiContext, UiProvider };

