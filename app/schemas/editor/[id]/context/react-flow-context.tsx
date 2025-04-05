import { createContext, useContext, useState } from 'react';

interface ReactFlowContextType {
  getNodesFromFlow: () => any[];
  setNodesGetter: (getter: () => any[]) => void;
}

const ReactFlowContext = createContext<ReactFlowContextType>({
  getNodesFromFlow: () => [],
  setNodesGetter: () => {},
});

export const ReactFlowProvider = ({ children }: { children: React.ReactNode }) => {
  const [getNodesFunc, setGetNodesFunc] = useState<() => any[]>(() => []);

  const setNodesGetter = (getter: () => any[]) => {
    setGetNodesFunc(() => getter);
  };

  const getNodesFromFlow = () => {
    return getNodesFunc();
  };

  return (
    <ReactFlowContext.Provider 
      value={{
        getNodesFromFlow,
        setNodesGetter,
      }}
    >
      {children}
    </ReactFlowContext.Provider>
  );
};

export const useReactFlowContext = () => useContext(ReactFlowContext);