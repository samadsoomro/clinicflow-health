import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const clinicData = {
  name: "ClinicToken Demo Clinic",
  address: "123 Healthcare Avenue, Medical District, Karachi 75500",
  phone: "+92 300 1234567",
  hours: "Mon–Sat: 9:00 AM – 9:00 PM",
  lat: 24.8607,
  lng: 67.0011,
};

const Location = () => (
  <section className="py-16 md:py-20">
    <div className="container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
          <MapPin className="h-4 w-4" />
          Find Us
        </div>
        <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">Our Location</h1>
        <p className="text-muted-foreground">Visit us or get directions to our clinic.</p>
      </motion.div>

      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="overflow-hidden rounded-2xl border border-border shadow-card"
        >
          <iframe
            title="Clinic Location"
            className="w-full h-80 md:h-96"
            src={`https://www.google.com/maps?q=${clinicData.lat},${clinicData.lng}&output=embed`}
            loading="lazy"
            allowFullScreen
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid gap-4 sm:grid-cols-3"
        >
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{clinicData.address}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{clinicData.hours}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{clinicData.phone}</span>
          </div>
        </motion.div>

        <div className="mt-6 text-center">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${clinicData.lat},${clinicData.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="hero" size="lg">
              <Navigation className="mr-2 h-4 w-4" />
              View on Google Maps
            </Button>
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default Location;
