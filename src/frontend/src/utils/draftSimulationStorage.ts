import { SimulationParameters } from '../api/simulationClient';

// Constants
const STORAGE_KEY_DRAFTS = 'simulation_drafts';
const STORAGE_KEY_SIMULATION_HISTORY = 'simulation_history';

// Define types
export interface SimulationDraft {
  id: string;
  name: string;
  parameters: SimulationParameters;
  lastUpdated: number; // timestamp
  step?: number; // which step of the wizard was last completed
}

export interface SimulationHistoryItem {
  id: string;
  name: string;
  completed: boolean;
  createdAt: number;
  lastAccessedAt: number;
  parameters?: SimulationParameters;
}

/**
 * Save a draft simulation to localStorage
 * @param draft The draft simulation to save
 */
export const saveDraftSimulation = (draft: SimulationDraft): void => {
  try {
    // Get existing drafts
    const existingDrafts = getDraftSimulations();
    
    // Update the draft's lastUpdated timestamp
    const updatedDraft = {
      ...draft,
      lastUpdated: Date.now()
    };
    
    // Find if this draft already exists
    const draftIndex = existingDrafts.findIndex(d => d.id === draft.id);
    
    if (draftIndex >= 0) {
      // Update existing draft
      existingDrafts[draftIndex] = updatedDraft;
    } else {
      // Add new draft
      existingDrafts.push(updatedDraft);
    }
    
    // Save updated drafts
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(existingDrafts));
    
    // Also add to history if not already there
    addToSimulationHistory({
      id: draft.id,
      name: draft.name,
      completed: false,
      createdAt: draft.lastUpdated,
      lastAccessedAt: Date.now(),
      parameters: draft.parameters
    });
    
    console.log(`Draft simulation saved: ${draft.name} (${draft.id})`);
  } catch (error) {
    console.error('Failed to save draft simulation:', error);
  }
};

/**
 * Get all draft simulations from localStorage
 * @returns Array of draft simulations
 */
export const getDraftSimulations = (): SimulationDraft[] => {
  try {
    const draftsJson = localStorage.getItem(STORAGE_KEY_DRAFTS);
    return draftsJson ? JSON.parse(draftsJson) : [];
  } catch (error) {
    console.error('Failed to get draft simulations:', error);
    return [];
  }
};

/**
 * Get a specific draft simulation from localStorage
 * @param id The ID of the draft to get
 * @returns The draft simulation, or null if not found
 */
export const getDraftSimulation = (id: string): SimulationDraft | null => {
  try {
    const drafts = getDraftSimulations();
    const draft = drafts.find(d => d.id === id);
    
    if (draft) {
      // Update access timestamp in history
      updateSimulationAccessTime(id);
    }
    
    return draft || null;
  } catch (error) {
    console.error(`Failed to get draft simulation with ID ${id}:`, error);
    return null;
  }
};

/**
 * Delete a draft simulation from localStorage
 * @param id The ID of the draft to delete
 * @returns True if successful, false otherwise
 */
export const deleteDraftSimulation = (id: string): boolean => {
  try {
    const drafts = getDraftSimulations();
    const newDrafts = drafts.filter(d => d.id !== id);
    
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(newDrafts));
    return true;
  } catch (error) {
    console.error(`Failed to delete draft simulation with ID ${id}:`, error);
    return false;
  }
};

/**
 * Clear all draft simulations from localStorage
 * @returns True if successful, false otherwise
 */
export const clearDraftSimulations = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY_DRAFTS);
    return true;
  } catch (error) {
    console.error('Failed to clear draft simulations:', error);
    return false;
  }
};

/**
 * Add a simulation to the history in localStorage
 * @param item The simulation to add to history
 */
export const addToSimulationHistory = (item: SimulationHistoryItem): void => {
  try {
    // Get existing history
    const history = getSimulationHistory();
    
    // Find if this item already exists
    const itemIndex = history.findIndex(h => h.id === item.id);
    
    if (itemIndex >= 0) {
      // Update existing item
      history[itemIndex] = {
        ...history[itemIndex],
        ...item,
        lastAccessedAt: Date.now()
      };
    } else {
      // Add new item
      history.push({
        ...item,
        lastAccessedAt: Date.now()
      });
    }
    
    // Limit history to 50 items
    const limitedHistory = history
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 50);
    
    // Save updated history
    localStorage.setItem(STORAGE_KEY_SIMULATION_HISTORY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Failed to add to simulation history:', error);
  }
};

/**
 * Get all simulation history items from localStorage
 * @returns Array of simulation history items
 */
export const getSimulationHistory = (): SimulationHistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(STORAGE_KEY_SIMULATION_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to get simulation history:', error);
    return [];
  }
};

/**
 * Mark a simulation as completed in the history
 * @param id The ID of the simulation to mark as completed
 */
export const markSimulationCompleted = (id: string): void => {
  try {
    const history = getSimulationHistory();
    const itemIndex = history.findIndex(h => h.id === id);
    
    if (itemIndex >= 0) {
      history[itemIndex].completed = true;
      history[itemIndex].lastAccessedAt = Date.now();
      
      localStorage.setItem(STORAGE_KEY_SIMULATION_HISTORY, JSON.stringify(history));
      
      // Once completed, we can remove it from drafts
      deleteDraftSimulation(id);
    }
  } catch (error) {
    console.error('Failed to mark simulation as completed:', error);
  }
};

/**
 * Update the last access time for a simulation in history
 * @param id The ID of the simulation to update
 */
export const updateSimulationAccessTime = (id: string): void => {
  try {
    const history = getSimulationHistory();
    const itemIndex = history.findIndex(h => h.id === id);
    
    if (itemIndex >= 0) {
      history[itemIndex].lastAccessedAt = Date.now();
      localStorage.setItem(STORAGE_KEY_SIMULATION_HISTORY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to update simulation access time:', error);
  }
};

/**
 * Delete a simulation from history
 * @param id The ID of the simulation to delete
 * @returns True if successful, false otherwise
 */
export const deleteFromSimulationHistory = (id: string): boolean => {
  try {
    const history = getSimulationHistory();
    const newHistory = history.filter(h => h.id !== id);
    
    localStorage.setItem(STORAGE_KEY_SIMULATION_HISTORY, JSON.stringify(newHistory));
    return true;
  } catch (error) {
    console.error(`Failed to delete simulation from history with ID ${id}:`, error);
    return false;
  }
};

/**
 * Clean up draft simulations older than the specified number of days
 * @param days Number of days after which a draft is considered stale (default: 30)
 */
export const cleanupStaleDrafts = (days: number = 30): void => {
  try {
    const drafts = getDraftSimulations();
    const now = Date.now();
    const staleTimestamp = now - (days * 24 * 60 * 60 * 1000);
    
    const freshDrafts = drafts.filter(draft => draft.lastUpdated > staleTimestamp);
    
    if (freshDrafts.length !== drafts.length) {
      localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(freshDrafts));
      console.log(`Cleaned up ${drafts.length - freshDrafts.length} stale draft simulations`);
    }
  } catch (error) {
    console.error('Failed to clean up stale drafts:', error);
  }
}; 