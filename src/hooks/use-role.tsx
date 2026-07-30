import { createContext, useContext, useEffect, useState } from 'react';

type Role = 'admin' | 'marketing';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem('chatgate_role');
    return (saved as Role) || 'admin';
  });

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem('chatgate_role', newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, isAdmin: role === 'admin' }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
