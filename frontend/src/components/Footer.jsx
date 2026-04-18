import React, { useState } from "react";
import { Link } from "react-router-dom";
import useTranslatedText from "../hooks/useTranslatedText";
import { useAppSettings } from "../contexts/AppSettingsContext";

const Footer = () => {
  const { theme } = useAppSettings();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState(null);

  const descriptionText = useTranslatedText(
    "Find your perfect home away from home. SmartRent provides a secure platform for property rental with verified hosts and quality listings."
  );
  const quickLinksText = useTranslatedText("Quick Links");
  const homeText = useTranslatedText("Home");
  const aboutUsText = useTranslatedText("About us");
  const contactText = useTranslatedText("Contact");
  const blogText = useTranslatedText("Blog");
  const supportText = useTranslatedText("Support");
  const contactUsText = useTranslatedText("Contact Us");
  const helpText = useTranslatedText("Help");
  const safetyText = useTranslatedText("Safety Information");
  const cancellationText = useTranslatedText("Cancellation Options");
  const reportText = useTranslatedText("Report Concern");
  const faqText = useTranslatedText("FAQ");
  const subscribeText = useTranslatedText("Subscribe to Newsletter");
  const privacyPolicyText = useTranslatedText("Privacy Policy");
  const termsOfServiceText = useTranslatedText("Terms of Service");
  const cookiePolicyText = useTranslatedText("Cookie Policy");

  const isDark = theme === "dark";
  const footerClass = isDark ? "bg-black text-white" : "bg-white/95 text-black";
  const headingClass = isDark ? "text-white" : "text-black";
  const bodyClass = isDark ? "text-neutral-300" : "text-neutral-700";
  const linkClass = isDark
    ? "text-neutral-300 hover:text-primary-400"
    : "text-neutral-700 hover:text-primary-600";
  const socialClass = isDark ? "bg-neutral-800" : "bg-neutral-200";
  const dividerClass = isDark ? "border-neutral-800" : "border-neutral-200";

  const handleSubscribe = async (event) => {
    event.preventDefault();
    if (!email || !email.includes("@")) {
      setSubscribeStatus("error");
      return;
    }

    setIsSubscribing(true);
    setSubscribeStatus(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubscribeStatus("success");
      setEmail("");
    } catch (error) {
      setSubscribeStatus("error");
    } finally {
      setIsSubscribing(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${footerClass} pt-12 sm:pt-16 pb-8 sm:pb-10`} role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="mb-12 grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:gap-12 sm:text-left lg:grid-cols-4"
          role="navigation"
          aria-label="Footer navigation"
        >
          <div className="group flex flex-col items-center sm:items-start">
            <h3 className={`mb-4 inline-flex items-center text-xl font-semibold transition duration-300 group-hover:-translate-y-1 sm:mb-6 sm:text-2xl ${headingClass}`}>
              <span className="font-bold text-primary-500">Smart</span>
              <span className="font-light">RentSystem</span>
            </h3>
            <p className={`mb-6 max-w-sm leading-relaxed transition duration-300 group-hover:text-primary-500 ${bodyClass}`}>{descriptionText}</p>
            <div className="flex space-x-4">
              {[
                ["https://facebook.com", "fab fa-facebook-f", "Follow us on Facebook"],
                ["https://twitter.com", "fab fa-twitter", "Follow us on Twitter"],
                ["https://instagram.com", "fab fa-instagram", "Follow us on Instagram"],
                ["https://www.linkedin.com/in/hitesh-kumar-dev/", "fab fa-linkedin-in", "Follow us on LinkedIn"],
              ].map(([href, icon, label]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialClass} flex h-10 w-10 items-center justify-center rounded-full text-white transition duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-primary-600 hover:shadow-[0_18px_30px_-16px_rgba(239,68,68,0.75)]`}
                  aria-label={label}
                >
                  <i className={icon} />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-4 sm:mt-0">
            <h3 className={`mb-4 inline-block border-b-2 border-primary-500 pb-1 text-lg font-semibold sm:mb-6 ${headingClass}`}>
              {quickLinksText}
            </h3>
            <ul className="space-y-3">
              {[
                ["/", homeText],
                ["/about", aboutUsText],
                ["/contact", contactText],
                ["/blog", blogText],
              ].map(([to, label]) => (
                <li key={to} className="group">
                  <Link
                    to={to}
                    className={`inline-flex items-center transition duration-300 group-hover:translate-x-1 ${linkClass}`}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <i className="fas fa-chevron-right mr-2 text-xs text-primary-500" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={`mb-6 text-lg font-semibold ${headingClass}`}>{supportText}</h3>
            <ul className="space-y-3">
              {[
                ["/help", helpText],
                ["/safety", safetyText],
                ["/cancellation", cancellationText],
                ["/report-concern", reportText],
                ["/faq", faqText],
              ].map(([to, label]) => (
                <li key={to} className="group">
                  <Link
                    to={to}
                    className={`inline-flex items-center transition duration-300 group-hover:translate-x-1 ${linkClass}`}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <i className="fas fa-chevron-right mr-2 text-xs text-primary-500" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 sm:mt-0">
            <h3 className={`mb-4 inline-block border-b-2 border-primary-500 pb-1 text-lg font-semibold sm:mb-6 ${headingClass}`}>
              {contactUsText}
            </h3>
            <ul className={`space-y-4 ${bodyClass}`}>
              <li className="group flex items-start justify-center sm:justify-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3 text-primary-500" />
                <span className="transition duration-300 group-hover:translate-x-1">Ajmer, Rajasthan, India</span>
              </li>
              <li className="group flex items-center justify-center sm:justify-start">
                <i className="fas fa-phone-alt mr-3 text-primary-500" />
                <a href="tel:+11234567890" className={`${linkClass} transition duration-300 group-hover:translate-x-1`}>
                  +1 (123) 456-7890
                </a>
              </li>
              <li className="group flex items-center justify-center sm:justify-start">
                <i className="fas fa-envelope mr-3 text-primary-500" />
                <a href="mailto:info@smartrentsystem.com" className={`${linkClass} transition duration-300 group-hover:translate-x-1`}>
                  info@smartrentsystem.com
                </a>
              </li>
            </ul>

            <div className="mt-8">
              <h4 className={`mb-4 text-sm font-semibold ${headingClass}`}>{subscribeText}</h4>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="mx-auto flex max-w-sm transition-transform duration-300 focus-within:scale-[1.02] sm:mx-0">
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`w-full rounded-l-lg bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      subscribeStatus === "error" ? "ring-2 ring-red-500" : ""
                    }`}
                    disabled={isSubscribing}
                    aria-label="Email for newsletter"
                    aria-invalid={subscribeStatus === "error"}
                    aria-describedby="newsletter-feedback"
                  />
                  <button
                    type="submit"
                    className={`min-w-[48px] rounded-r-lg bg-primary-600 px-4 py-2.5 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_18px_30px_-16px_rgba(239,68,68,0.75)] ${
                      isSubscribing ? "animate-pulse" : ""
                    }`}
                    disabled={isSubscribing}
                    aria-label={isSubscribing ? "Subscribing..." : "Subscribe to newsletter"}
                  >
                    {isSubscribing ? (
                      <i className="fas fa-circle-notch fa-spin" />
                    ) : (
                      <i className="fas fa-paper-plane" />
                    )}
                  </button>
                </div>

                {subscribeStatus && (
                  <p
                    id="newsletter-feedback"
                    className={`text-center text-sm sm:text-left ${
                      subscribeStatus === "success" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {subscribeStatus === "success"
                      ? "Thank you for subscribing!"
                      : "Please enter a valid email address."}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className={`mt-8 flex flex-col items-center justify-between border-t pt-8 text-center sm:flex-row sm:text-left ${dividerClass}`}>
          <p className={`mb-4 text-sm sm:mb-0 ${bodyClass}`}>
            &copy; {currentYear}{" "}
            <span className={`font-medium ${headingClass}`}>SmartRentSystem</span>. All rights reserved.
          </p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
            <Link
              to="/privacy"
              className={`text-sm transition duration-300 hover:-translate-y-0.5 ${linkClass}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              {privacyPolicyText}
            </Link>
            <span className={isDark ? "hidden text-neutral-600 sm:block" : "hidden text-neutral-400 sm:block"}>•</span>
            <Link
              to="/terms"
              className={`text-sm transition duration-300 hover:-translate-y-0.5 ${linkClass}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              {termsOfServiceText}
            </Link>
            <span className={isDark ? "hidden text-neutral-600 sm:block" : "hidden text-neutral-400 sm:block"}>•</span>
            <Link
              to="/cookies"
              className={`text-sm transition duration-300 hover:-translate-y-0.5 ${linkClass}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              {cookiePolicyText}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
