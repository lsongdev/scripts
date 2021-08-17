import { useState, useEffect } from '../components/react.js';

export const useRequest = (fn, options = {}) => {
  const { initialState } = options;
  const [error, setError] = useState(null);
  const [data, setResult] = useState();
  const [loading, setLoading] = useState(true);
  const run = state => {
    setLoading(true);
    fn(state).then(
      res => {
        setResult(res)
        setLoading(false)
      },
      err => {
        setError(err);
        setLoading(false);
      }
    );
  };
  useEffect(() =>
    run(initialState), []);
  return {
    error,
    data,
    loading,
    run,
  };
};
