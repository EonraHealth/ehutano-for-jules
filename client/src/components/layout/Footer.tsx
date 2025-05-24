import { Link } from 'wouter';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ehutano<span className="text-green-500">+</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Zimbabwe's integrated healthcare platform connecting patients, pharmacies, doctors, and wholesalers.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Portals</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/patient-portal" className="text-sm text-gray-600 hover:text-primary-600">
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link href="/pharmacy-portal" className="text-sm text-gray-600 hover:text-primary-600">
                  Pharmacy Portal
                </Link>
              </li>
              <li>
                <Link href="/doctor-portal" className="text-sm text-gray-600 hover:text-primary-600">
                  Doctor Portal
                </Link>
              </li>
              <li>
                <Link href="/wholesaler-portal" className="text-sm text-gray-600 hover:text-primary-600">
                  Wholesaler Portal
                </Link>
              </li>
              <li>
                <Link href="/wellness-hub" className="text-sm text-gray-600 hover:text-primary-600">
                  Wellness Hub
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/medicines" className="text-sm text-gray-600 hover:text-primary-600">
                  Medicine Database
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-600 hover:text-primary-600">
                  Health Blog
                </Link>
              </li>
              <li>
                <Link href="/pharmacies" className="text-sm text-gray-600 hover:text-primary-600">
                  Pharmacies Near You
                </Link>
              </li>
              <li>
                <Link href="/medical-aid" className="text-sm text-gray-600 hover:text-primary-600">
                  Medical Aid Information
                </Link>
              </li>
              <li>
                <Link href="/regulations" className="text-sm text-gray-600 hover:text-primary-600">
                  MCAZ Regulations
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">
                <span className="font-medium">Address:</span>
                <br />
                123 Samora Machel Ave
                <br />
                Harare, Zimbabwe
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Email:</span>
                <br />
                support@ehutanoplus.co.zw
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Phone:</span>
                <br />
                +263 242 123 456
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between">
          <p className="text-xs text-gray-500">© 2025 ehutano+. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-600">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-600">
              Terms of Service
            </Link>
            <Link href="/compliance" className="text-xs text-gray-500 hover:text-gray-600">
              MCAZ Compliance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
