import type { PropsWithChildren } from 'react';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { RoomProvider } from './context/RoomContext';
import { UiProvider } from './context/UiContext';

const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <AuthProvider>
      <SocketProvider>
        <UiProvider>
          <RoomProvider>{children}</RoomProvider>
        </UiProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default AppProviders;

