import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const WA_NUMBER = "59178706531";
const EMAIL = "cretassichostal@gmail.com";
// Address parts translated via i18n

const MAPS_EMBED =
  "https://maps.google.com/maps?q=Cretassic+Hostal+Sucre+Bolivia&t=&z=17&ie=UTF8&iwloc=&output=embed";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  testId: string;
}

function InfoRow({ icon, label, value, href, testId }: InfoRowProps) {
  const content = (
    <div
      data-testid={testId}
      className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shrink-0 group-hover:bg-amber-400 group-hover:text-black transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}

export default function Contact() {
  const { t } = useTranslation();

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="bg-white py-20 px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2
            data-testid="contact-title"
            className="text-4xl font-bold text-gray-900 mb-3"
          >
            {t("contact.title")}
          </h2>
          <p
            data-testid="contact-subtitle"
            className="text-gray-500 text-lg"
          >
            {t("contact.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — info + WhatsApp CTA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div
              data-testid="contact-info"
              className="bg-gray-50 rounded-2xl p-6 mb-6"
            >
              <InfoRow
                testId="contact-address"
                icon={<MapPin size={18} />}
                label={t("contact.addressLabel")}
                value={t("contact.address")}
                href="https://maps.google.com/?q=Cretassic+Hostal+Sucre+Bolivia"
              />
              <InfoRow
                testId="contact-phone"
                icon={<Phone size={18} />}
                label="WhatsApp"
                value={`+591 ${WA_NUMBER.slice(3)}`}
                href={`https://wa.me/${WA_NUMBER}`}
              />
              <InfoRow
                testId="contact-email"
                icon={<Mail size={18} />}
                label="Email"
                value={EMAIL}
                href={`mailto:${EMAIL}`}
              />
              <InfoRow
                testId="contact-hours"
                icon={<Clock size={18} />}
                label={t("contact.hoursLabel")}
                value={t("contact.hours")}
              />
            </div>

            {/* WhatsApp CTA — discrete */}
            <a
              data-testid="contact-wa-btn"
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t("contact.waGreeting"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-fit mx-auto text-green-600 hover:text-green-500 text-sm font-medium transition-colors underline underline-offset-4"
            >
              <MessageCircle size={15} />
              {t("contact.waCta")}
            </a>
          </motion.div>

          {/* Right — Google Maps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            data-testid="contact-map"
            className="rounded-2xl overflow-hidden shadow-lg h-96 lg:h-full min-h-80"
          >
            <iframe
              title="Cretassic Hostal location"
              src={MAPS_EMBED}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "320px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
