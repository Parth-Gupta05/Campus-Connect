import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true; // Send cookies

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
        const token = localStorage.getItem('accessToken');
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
              localStorage.setItem('accessToken', newToken);
              
              const payload = JSON.parse(atob(newToken.split('.')[1]));
              setUser({ id: payload.id, role: payload.role });

              isRefreshing = false;
              onRefreshed(newToken);
              
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            } catch (refreshError) {
              isRefreshing = false;
              localStorage.removeItem('accessToken');
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
           localStorage.removeItem('accessToken');
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
        localStorage.setItem('accessToken', res.data.accessToken);
        // We need to decode JWT to get user info, but for simplicity we'll just set a basic user object
        // Real app would fetch /api/auth/me using the new token
        // For now, decode the token payload manually
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
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};