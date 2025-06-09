import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#3F0052] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-normal">About BraidsNow</h3>
            <p className="text-white font-light tracking-normal">
              BraidsNow.com is a resource for all things Braids and Black Hair. 
              We believe hairstyles are a work of art and should be appreciated as such.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-normal">For Clients</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/client-community" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  Join BN Client Community
                </Link>
              </li>
              <li>
                <Link 
                  to="/find-stylists" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  Find Stylists
                </Link>
              </li>
              <li>
                <Link 
                  to="/faqs" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* For Stylists */}
          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-normal">For Stylists</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/stylist-community" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  Register My Business
                </Link>
              </li>
              <li>
                <Link 
                  to="/business-tools" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  Business Tools
                </Link>
              </li>
              <li>
                <Link 
                  to="/success-stories" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-normal">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/terms" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-white hover:text-[#FBCC14] tracking-normal font-light"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 tracking-normal">Connect With Us</h3>
              <a 
                href="https://www.instagram.com/braidsnowdotcom/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-[#FFFFFF] hover:text-[#B98EC1]"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#B98EC1]">
          <div className="text-center text-white text-md tracking-normal font-light">
            <p>© 2025 BraidsNow. All Rights Reserved | Built by{' '}
              <a 
                href="https://mfjdev.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#FBCC14] hover:text-[#B98EC1]"
              >
                MFJ Web Development Company, LLC
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
