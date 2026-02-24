import { Link } from "react-router-dom";
import { Facebook, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-display font-bold text-lg">
                B
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Barangay Portal</h3>
                <p className="text-xs text-sidebar-foreground/70">Citizen Engagement System</p>
              </div>
            </div>
            <p className="text-sm text-sidebar-foreground/80 leading-relaxed">
              Empowering our community through digital governance. Access services, submit feedback, and stay connected with your barangay.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/80">
              <li><Link to="/registry" className="hover:text-sidebar-foreground transition-colors">Citizen Registry</Link></li>
              <li><Link to="/feedback" className="hover:text-sidebar-foreground transition-colors">Feedback Portal</Link></li>
              <li><Link to="/certificates" className="hover:text-sidebar-foreground transition-colors">Request Certificate</Link></li>
              <li><Link to="/surveys" className="hover:text-sidebar-foreground transition-colors">Surveys & Consultations</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold">Services</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/80">
              <li><Link to="/certificates" className="hover:text-sidebar-foreground transition-colors">Barangay Clearance</Link></li>
              <li><Link to="/certificates" className="hover:text-sidebar-foreground transition-colors">Certificate of Residency</Link></li>
              <li><Link to="/certificates" className="hover:text-sidebar-foreground transition-colors">Certificate of Indigency</Link></li>
              <li><Link to="/certificates" className="hover:text-sidebar-foreground transition-colors">Barangay ID</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <ul className="space-y-3 text-sm text-sidebar-foreground/80">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Barangay Hall, Main Street, Municipality, Province</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" />
                <span>(02) 1234-5678</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" />
                <span>barangay@email.gov.ph</span>
              </li>
            </ul>
            <div className="flex gap-3 pt-2">
              <a href="#" className="h-9 w-9 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-sidebar-foreground/60">
          <p>© 2024 Barangay Portal. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-sidebar-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-sidebar-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
