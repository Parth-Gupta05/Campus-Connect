import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = `${apiUrl}/api`;
axios.defaults.withCredentials = true; // Send cookies

const STORAGE_KEY = 'accessToken';

const getActiveStorage = () => {
  if (localStorage.getItem(STORAGE_KEY)) return localStorage;
  if (sessionStorage.getItem(STORAGE_KEY)) return sessionStorage;
  return localStorage;
};

const readAccessToken = () => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) return token;
  return sessionStorage.getItem(STORAGE_KEY);
};

const writeAccessToken = (token, storage) => {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  storage.setItem(STORAGE_KEY, token);
};

const clearAccessToken = () => {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Axios interceptors to add access token and handle 401s globally
  useEffect(() => {
    let isRefreshing = false;
    let refreshSubscribers = [];

    const subscribeTokenRefresh = (cb) => {
      refreshSubscribers.push(cb);
    };

    const onRefreshed = (token) => {
      refreshSubscribers.forEach((cb) => cb(token));
      refreshSubscribers = [];
    };

    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = readAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response && 
          error.response.status === 401 && 
          originalRequest &&
          !originalRequest.url.includes('/auth/refresh') && 
          !originalRequest.url.includes('/auth/login') &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          if (!isRefreshing) {
            isRefreshing = true;
            try {
              const res = await axios.post('/auth/refresh');
              const newToken = res.data.accessToken;
              writeAccessToken(newToken, getActiveStorage());
              
              const payload = JSON.parse(atob(newToken.split('.')[1]));
              setUser({ id: payload.id, role: payload.role });

              isRefreshing = false;
              onRefreshed(newToken);
              
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            } catch (refreshError) {
              isRefreshing = false;
              clearAccessToken();
              setUser(null);
              return Promise.reject(refreshError);
            }
          }

          // If a refresh is already in progress, queue the request
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(axios(originalRequest));
            });
          });
        }
        
        // If it's a 401 from the refresh endpoint itself
        if (error.response && error.response.status === 401 && originalRequest && originalRequest.url.includes('/auth/refresh')) {
           clearAccessToken();
           setUser(null);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Try to refresh token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.post('/auth/refresh');
        writeAccessToken(res.data.accessToken, getActiveStorage());
        const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
        setUser({ id: payload.id, role: payload.role });
      } catch (err) {
        console.log('No valid session found');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (identifier, password, remember = false) => {
    const res = await axios.post('/auth/login', { identifier, password, remember });
    writeAccessToken(res.data.accessToken, remember ? localStorage : sessionStorage);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    clearAccessToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};