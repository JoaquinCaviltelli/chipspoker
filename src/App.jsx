import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Room from "./pages/GameRoom";
import TableVirtual from "./pages/TableVirtual";
import "/src/index.css"

const App = () => {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game-room" element={<Room />} />
          <Route path="/table-virtual" element={<TableVirtual />} />
        </Routes>
      </Router>
  );
};

export default App;
