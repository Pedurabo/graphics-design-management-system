import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';

// Components
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Projects from './pages/Projects';
import Assets from './pages/Assets';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { EditorProvider } from './contexts/EditorContext';

// Styles
const AppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #1a1a1a;
  color: #ffffff;
`;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EditorProvider>
          <AppContainer>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="editor/:projectId" element={<Editor />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="assets" element={<Assets />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </AppContainer>
        </EditorProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 