import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Docs', href: '/docs' },
      { name: 'Changelog', href: '#changelog' }
    ],
    Company: [
      { name: 'Blog', href: '/blog/differential-privacy' },
      { name: 'Careers', href: '#careers' },
      { name: 'Privacy', href: '#privacy' }
    ],
    Social: [
      { name: 'GitHub', href: '#github', icon: Github },
      { name: 'X', href: '#twitter', icon: Twitter },
      { name: 'LinkedIn', href: '#linkedin', icon: Linkedin }
    ]
  };

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Pythia</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Privacy-first analytics that predicts what happens next.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.Product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.Company.map((link) => (
                <li key={link.name}>
                  {link.name === 'Blog' ? (
                    <Link
                      to={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Social</h4>
            <ul className="space-y-3">
              {footerLinks.Social.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          <p className="text-center text-slate-400 text-sm">
            © {currentYear} Pythia Analytics Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}