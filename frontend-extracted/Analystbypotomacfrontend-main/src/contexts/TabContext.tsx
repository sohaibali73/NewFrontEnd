import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TabState {
  [key: string]: {
    activeTab: string;
    tabData: any;
  };
}

interface TabContextType {
  tabStates: TabState;
  setActiveTab: (page: string, tab: string) => void;
  setTabData: (page: string, data: any) => void;
  getTabState: (page: string) => { activeTab: string; tabData: any };
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabs = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
};

interface TabProviderProps {
  children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
  const [tabStates, setTabStates] = useState<TabState>({});

  const setActiveTab = useCallback((page: string, tab: string) => {
    setTabStates(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        activeTab: tab,
      },
    }));
  }, []);

  const setTabData = useCallback((page: string, data: any) => {
    setTabStates(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        tabData: data,
      },
    }));
  }, []);

  const getTabState = useCallback((page: string) => {
    return tabStates[page] || { activeTab: 'overview', tabData: null };
  }, [tabStates]);

  const value = {
    tabStates,
    setActiveTab,
    setTabData,
    getTabState,
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
};