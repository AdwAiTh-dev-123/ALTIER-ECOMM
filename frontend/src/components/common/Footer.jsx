import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-logo">ATELIER</span>
          <p className="footer-tagline">
            Minimal, purposeful clothing crafted with timeless aesthetics and sustainable materials.
          </p>
        </div>

        <div className="footer-links-group">
          <div className="footer-col">
            <h4 className="footer-col-title">Shop</h4>
            <Link to="/" className="footer-link">All Products</Link>
            <Link to="/?category=cat-1" className="footer-link">T-Shirts</Link>
            <Link to="/?category=cat-2" className="footer-link">Linen Shirts</Link>
            <Link to="/?category=cat-3" className="footer-link">Trousers</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Account</h4>
            <Link to="/profile" className="footer-link">Orders & Profile</Link>
            <Link to="/cart" className="footer-link">Shopping Bag</Link>
            <Link to="/admin" className="footer-link">Admin Portal</Link>
          </div>
        </div>
      </div>


      <div className="footer-bottom">
        <p className="copyright-text">
          &copy; {new Date().getFullYear()} ATELIER. Minimal E-Commerce Project.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
