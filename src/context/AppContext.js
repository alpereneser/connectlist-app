import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  selectedCategory: null,
  selectedItems: [],
  selectedChat: null,
};

// Action types
const ActionTypes = {
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_SELECTED_ITEMS: 'SET_SELECTED_ITEMS',
  SET_SELECTED_CHAT: 'SET_SELECTED_CHAT',
  RESET_SELECTION: 'RESET_SELECTION',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_SELECTED_CATEGORY:
      return { ...state, selectedCategory: action.payload };
    case ActionTypes.SET_SELECTED_ITEMS:
      return { ...state, selectedItems: action.payload };
    case ActionTypes.SET_SELECTED_CHAT:
      return { ...state, selectedChat: action.payload };
    case ActionTypes.RESET_SELECTION:
      return { ...state, selectedCategory: null, selectedItems: [] };
    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    setSelectedCategory: category =>
      dispatch({ type: ActionTypes.SET_SELECTED_CATEGORY, payload: category }),
    setSelectedItems: items =>
      dispatch({ type: ActionTypes.SET_SELECTED_ITEMS, payload: items }),
    setSelectedChat: chat =>
      dispatch({ type: ActionTypes.SET_SELECTED_CHAT, payload: chat }),
    resetSelection: () => dispatch({ type: ActionTypes.RESET_SELECTION }),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes };
