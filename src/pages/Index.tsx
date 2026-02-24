import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Users, 
  MessageSquare, 
  FileText, 
  ClipboardList, 
  Bell, 
  ArrowRight, 
  Shield, 
  Clock, 
  CheckCircle,
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import heroCommunity from "@/assets/hero-community.jpg";

const services = [
  {
    icon: Users,
    title: "Citizen Registry",
    description: "Register and manage your citizen profile. Update personal information and access your records.",
    href: "/registry",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageSquare,
    title: "Feedback & Grievance",
    description: "Submit concerns, feedback, or grievances. Track your submissions and receive responses.",
    href: "/feedback",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: FileText,
    title: "Certificates & IDs",
    description: "Request barangay clearance, residency certificates, indigency certificates, and IDs online.",
    href: "/certificates",
    color: "bg-info/10 text-info",
  },
  {
    icon: ClipboardList,
    title: "Surveys & Consultations",
    description: "Participate in community surveys and public consultations. Your voice matters!",
    href: "/surveys",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: Bell,
    title: "Notifications & Alerts",
    description: "Stay updated with community announcements, emergency alerts, and important notices.",
    href: "/notifications",
    color: "bg-destructive/10 text-destructive",
  },
];

const stats = [
  { value: "10,000+", label: "Registered Citizens" },
  { value: "5,000+", label: "Requests Processed" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24/7", label: "Online Access" },
];

const features = [
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security measures.",
  },
  {
    icon: Clock,
    title: "Fast Processing",
    description: "Get your documents processed quickly with our streamlined system.",
  },
  {
    icon: CheckCircle,
    title: "Easy to Use",
    description: "Intuitive interface designed for all ages and technical abilities.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Index() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient text-primary-foreground">
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-transparent" />
        
        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Now offering online services
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Barangay,{" "}
                <span className="text-accent">Connected</span>
              </h1>
              
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-xl">
                Access government services, submit requests, and stay informed—all from the comfort of your home. 
                Experience modern governance at your fingertips.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                  <Link to="/auth">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-white/5">
                  <Link to="/certificates">
                    Request Certificate
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroCommunity}
                  alt="Barangay Community"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
              </div>
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-card text-card-foreground rounded-xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5,000+</p>
                    <p className="text-sm text-muted-foreground">Requests Processed</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/50 border-y border-border">
        <div className="container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Barangay Services
            </h2>
            <p className="text-muted-foreground text-lg">
              Access all essential barangay services online. No more long lines—complete your transactions from anywhere.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Link to={service.href} className="block h-full">
                    <div className="service-card h-full group">
                      <div className={`h-14 w-14 rounded-xl ${service.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-display font-semibold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center text-primary text-sm font-medium">
                        Learn more
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Why Choose Our{" "}
                  <span className="text-gradient">Digital Portal</span>?
                </h2>
                <p className="text-muted-foreground text-lg">
                  We're committed to providing secure, efficient, and accessible government services for all community members.
                </p>
              </div>

              <div className="space-y-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative bg-card rounded-2xl p-8 shadow-lg border border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Barangay Clearance</p>
                        <p className="text-xs text-muted-foreground">Request approved</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                      Ready
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Community Survey</p>
                        <p className="text-xs text-muted-foreground">Awaiting response</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                      Pending
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-info" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Community Alert</p>
                        <p className="text-xs text-muted-foreground">New announcement</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-info/10 text-info text-xs font-medium">
                      New
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl hero-gradient text-primary-foreground p-8 md:p-12 lg:p-16"
          >
            <div className="absolute inset-0 pattern-grid opacity-10" />
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Join thousands of citizens who are already enjoying convenient access to barangay services online.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                  <Link to="/auth">
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-white/5">
                  <Link to="/feedback">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
