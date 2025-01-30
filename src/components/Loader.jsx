// Loader.js
import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-white ">
      <div className="flex items-center justify-center h-full">
      <span className="loader"></span>
      </div>
    </div>
  );
};

export default Loader;
