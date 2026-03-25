import React from 'react';
import { useParams } from 'react-router-dom';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="section-padding">
      <div className="container-custom">
        <h1 className="text-4xl font-serif font-light mb-8">Product Details</h1>
        <p className="text-gray-600">Product ID: {id}</p>
        <p className="text-gray-600">Product page content coming soon...</p>
      </div>
    </div>
  );
};

export default ProductPage;