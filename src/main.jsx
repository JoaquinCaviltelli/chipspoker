// index.jsx o main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from "/src/context/AuthContext.jsx";
import { RoomProvider } from "/src/services/RoomService.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RoomProvider>
        <App />
      </RoomProvider>
    </AuthProvider>
  </React.StrictMode>
);
