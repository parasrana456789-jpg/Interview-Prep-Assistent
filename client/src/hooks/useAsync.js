import { useEffect, useState, useCallback } from 'react';
import { errMsg } from '../services/api.js';

/** Runs an async loader on mount and exposes { data, loading, error, reload }. */
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    return fn().then((data) => setState({ data, loading: false, error: '' })).catch((e) => setState({ data: null, loading: false, error: errMsg(e) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
