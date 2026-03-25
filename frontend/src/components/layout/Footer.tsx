import React from 'react';
import { Link } from 'react-router-dom';
import { usePublicSettings } from '../../context/PublicSettingsContext';

const Footer: React.FC = () => {
  const { settings, resolveAssetUrl } = usePublicSettings();
  const storeName = settings.general.storeName || 'The Cotton Butterflies';
  const logo = resolveAssetUrl(settings.general.logoUrl);
  const supportEmail = settings.support.supportEmail || settings.general.email || 'thecottonbutterflieshelpline@gmail.com';
  const generalEmail = settings.general.email || 'thecottonbutterflies@gmail.com';
  const phone = settings.general.phone || '+91 6698 54123';
  const address = settings.general.address || '1/243 Merkuthottam, ThangaiPudur, Tamilnadu 641 604';

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-6 flex items-center space-x-2">
              {logo ? (
                <img src={logo} alt={`${storeName} logo`} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-300 to-blue-300" />
              )}
              <h4 className="text-xl font-serif font-bold">{storeName}</h4>
            </div>
            <p className="text-gray-400">
              Elegant clothing and accessories for women and children since 2015.
            </p>
          </div>

          <div>
            <h5 className="mb-4 font-semibold">Shop</h5>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/women" className="hover:text-white">Women</Link></li>
              <li><Link to="/kids" className="hover:text-white">Kids</Link></li>
              <li><Link to="/accessories" className="hover:text-white">Accessories</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-white">New Arrivals</Link></li>
              <li><Link to="/collections" className="hover:text-white">Collections</Link></li>
              <li><Link to="/virtual-tour" className="hover:text-white">Virtual Tour</Link></li>
              <li><Link to="/best-sellers" className="hover:text-white">Best Sellers</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 font-semibold">Information</h5>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact-support" className="hover:text-white">Contact Support</Link></li>
              <li><Link to="/shipping" className="hover:text-white">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white">Returns & Exchanges</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 font-semibold">Contact</h5>
            <p className="mb-2 text-gray-400">{address}</p>
            <p className="mb-2 text-gray-400">{generalEmail}</p>
            <p className="mb-4 text-gray-400">Helpline: {supportEmail}</p>
            <p className="text-gray-400">{phone}</p>
            <div className="mt-4 space-y-1 text-gray-400">
              {settings.social.instagramUrl && (
                <a href={settings.social.instagramUrl} target="_blank" rel="noreferrer" className="block hover:text-white">Instagram</a>
              )}
              {settings.social.facebookUrl && (
                <a href={settings.social.facebookUrl} target="_blank" rel="noreferrer" className="block hover:text-white">Facebook</a>
              )}
              {settings.social.whatsappNumber && (
                <a href={`https://wa.me/${settings.social.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="block hover:text-white">WhatsApp</a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
