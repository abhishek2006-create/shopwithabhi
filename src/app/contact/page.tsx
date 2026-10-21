import { ContactForm } from "@/components/forms";
import { getSettings } from "@/lib/data";
import { site } from "@/config/site";
export const metadata = {
  title: "Get in touch",
  alternates: { canonical: "/contact" },
};
export default async function Contact() {
  const settings = await getSettings();
  const email = settings.contactEmail || site.contactEmail;
  return (
    <div className="container page-body">
      <div className="page-heading">
        <span className="eyebrow">LET’S TALK</span>
        <h1>
          A good conversation
          <br />
          starts here.
        </h1>
        <p>
          Have a question, spotted a correction, or want to suggest a guide?
          We’d like to hear from you.
        </p>
      </div>
      <div className="contact-grid">
        <div>
          <h2>A note before you write.</h2>
          <p>
            Please don’t share passwords, payment details, or sensitive personal
            information. For order support, contact the retailer directly.
          </p>
          {email ? (
            <p style={{ marginTop: 20 }}>
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          ) : (
            <div className="notice">
              Contact and support addresses are awaiting owner configuration.
              The form stores messages once the Convex backend is connected.
            </div>
          )}
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
