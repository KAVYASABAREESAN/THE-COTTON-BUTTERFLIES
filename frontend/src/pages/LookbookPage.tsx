import React from 'react';
import { Link } from 'react-router-dom';

const LookbookPage: React.FC = () => {
  return (
    <div className="section-padding">
      <div className="container-custom">
        <h1 className="text-4xl font-serif font-light mb-8">Lookbook</h1>
        <p className="text-gray-600 mb-6">Our latest fashion inspirations coming soon...</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  );
};

export default LookbookPage;