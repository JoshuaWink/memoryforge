import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { dbGetAll, dbSave, dbClear, dbImport } from '../lib/db.js';
import { loadProfile, saveProfile as _saveProfile } from '../lib/profile.js';
import { updateDrillRating, updateReadingRating, backfillRatings, getRatingDisplay } from '../lib/ratings.js';
import { clearAll as clearStorage, writeSnapshot, readSnapshot } from '../lib/storage.js';

const AppContext = createContext(null);

export function AppProvider({ children, navigate }) {
  const [drills, setDrills]               = useState([]);
  const [profile, setProfile]             = useState(loadProfile);
  const [ratingsVersion, setRatingsVersion] = useState(0);
  const backfilled = useRef(false);

  // Load all drills from IndexedDB on mount + backfill ratings once
  useEffect(() => {
    dbGetAll().then(all => {
      setDrills(all);
      if (!backfilled.current) {
        backfilled.current = true;
        backfillRatings(all);
        setRatingsVersion(v => v + 1);
      }
    });
  }, []);

  const saveDrill = useCallback(async (result) => {
    await dbSave(result);
    updateDrillRating(result);
    setRatingsVersion(v => v + 1);
    setDrills(prev => [...prev, result]);
  }, []);

  const saveProfile = useCallback((p) => {
    _saveProfile(p);
    setProfile(p);
  }, []);

  const recordReading = useCallback((wpm, comp) => {
    updateReadingRating(wpm, comp);
    setRatingsVersion(v => v + 1);
  }, []);

  const clearAll = useCallback(async () => {
    await dbClear();
    clearStorage();
    backfilled.current = false;
    setDrills([]);
    setProfile(loadProfile());
    setRatingsVersion(v => v + 1);
  }, []);

  const exportBundle = useCallback(async () => {
    const all = await dbGetAll();
    return {
      version: 2,
      exported: new Date().toISOString().slice(0, 10),
      app: 'memoryforge',
      data: { drills: all, storage: readSnapshot() },
    };
  }, []);

  const importBundle = useCallback(async (blob, opts = {}) => {
    if (!blob || !blob.version) throw new Error('Unsupported file version');
    const payload = blob.data || {};
    const drillBlob = { version: 1, data: { drills: payload.drills || [] } };
    await dbImport(drillBlob, opts);
    writeSnapshot(payload.storage || {}, { merge: !!opts.merge });
    const all = await dbGetAll();
    setDrills(all);
    setProfile(loadProfile());
    backfilled.current = false;
    backfillRatings(all);
    setRatingsVersion(v => v + 1);
    return { drillCount: (payload.drills || []).length };
  }, []);

  // getRating is a function so consumers always get fresh data after ratingsVersion changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getRating = useCallback((lane) => getRatingDisplay(lane), [ratingsVersion]);

  return (
    <AppContext.Provider value={{
      drills, saveDrill,
      profile, saveProfile,
      getRating, recordReading,
      clearAll, exportBundle, importBundle,
      navigate,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
