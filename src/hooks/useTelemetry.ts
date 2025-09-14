import { useState, useEffect } from 'react';

export interface TelemetryData {
  quickActions: {
    newLead: number;
    newTask: number;
    newOptimization: number;
    chatIA: number;
  };
  keyboardShortcuts: {
    searchFocus: number;
    newLead: number;
    newTask: number;
    newOptimization: number;
  };
  globalSearch: {
    searches: number;
    results: number;
    clicks: number;
  };
}

const TELEMETRY_KEY = 'metricus:telemetry';

export function useTelemetry() {
  const [data, setData] = useState<TelemetryData>(() => {
    try {
      const stored = localStorage.getItem(TELEMETRY_KEY);
      return stored ? JSON.parse(stored) : {
        quickActions: {
          newLead: 0,
          newTask: 0,
          newOptimization: 0,
          chatIA: 0
        },
        keyboardShortcuts: {
          searchFocus: 0,
          newLead: 0,
          newTask: 0,
          newOptimization: 0
        },
        globalSearch: {
          searches: 0,
          results: 0,
          clicks: 0
        }
      };
    } catch {
      return {
        quickActions: {
          newLead: 0,
          newTask: 0,
          newOptimization: 0,
          chatIA: 0
        },
        keyboardShortcuts: {
          searchFocus: 0,
          newLead: 0,
          newTask: 0,
          newOptimization: 0
        },
        globalSearch: {
          searches: 0,
          results: 0,
          clicks: 0
        }
      };
    }
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(data));
  }, [data]);

  const trackQuickAction = (action: keyof TelemetryData['quickActions']) => {
    setData(prev => ({
      ...prev,
      quickActions: {
        ...prev.quickActions,
        [action]: prev.quickActions[action] + 1
      }
    }));
  };

  const trackKeyboardShortcut = (shortcut: keyof TelemetryData['keyboardShortcuts']) => {
    setData(prev => ({
      ...prev,
      keyboardShortcuts: {
        ...prev.keyboardShortcuts,
        [shortcut]: prev.keyboardShortcuts[shortcut] + 1
      }
    }));
  };

  const trackSearch = (results: number) => {
    setData(prev => ({
      ...prev,
      globalSearch: {
        ...prev.globalSearch,
        searches: prev.globalSearch.searches + 1,
        results: prev.globalSearch.results + results
      }
    }));
  };

  const trackSearchClick = () => {
    setData(prev => ({
      ...prev,
      globalSearch: {
        ...prev.globalSearch,
        clicks: prev.globalSearch.clicks + 1
      }
    }));
  };

  const getTelemetryData = () => data;

  const resetTelemetry = () => {
    const initialData = {
      quickActions: {
        newLead: 0,
        newTask: 0,
        newOptimization: 0,
        chatIA: 0
      },
      keyboardShortcuts: {
        searchFocus: 0,
        newLead: 0,
        newTask: 0,
        newOptimization: 0
      },
      globalSearch: {
        searches: 0,
        results: 0,
        clicks: 0
      }
    };
    setData(initialData);
  };

  return {
    data,
    trackQuickAction,
    trackKeyboardShortcut,
    trackSearch,
    trackSearchClick,
    getTelemetryData,
    resetTelemetry
  };
}