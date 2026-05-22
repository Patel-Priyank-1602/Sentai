import { useState } from "react";
import { MessageSquare, Send, CheckCircle2, AlertTriangle, Loader2, Mail, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("https://formspree.io/f/mkoeroqj", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (res.ok) {
        setSucceeded(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const data = await res.json();
        setError(data?.errors?.map((err: any) => err.message).join(", ") || "Something went wrong.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
      <div className="relative w-full max-w-[1400px] mx-auto rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[85vh]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/image.png)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-semibold mb-4">
          <MessageSquare className="w-3.5 h-3.5" />
          Get in Touch
        </div> */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-surface-100 mb-2">
          Contact <span className="text-accent-300">Me</span>
        </h1>
        <p className="text-xs sm:text-sm text-surface-400 max-w-md mx-auto px-2 sm:px-0">
          Have a question, feedback, or found a bug? Drop us a message and we'll
          get back to you as soon as possible.
        </p>
      </div>

      {/* Success State */}
      {succeeded ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-cyber-500/15 border border-cyber-500/25 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-cyber-400" />
          </div>
          <h2 className="text-2xl font-bold text-surface-100 mb-2">
            Message Sent!
          </h2>
          <p className="text-surface-400 mb-6">
            Thanks for reaching out. We'll get back to you shortly.
          </p>
          <button
            onClick={() => setSucceeded(false)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Send Another Message
          </button>
        </div>
      ) : (
        /* Contact Form */
        <form onSubmit={handleSubmit} className="glass-card p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-2"
              >
                <User className="w-4 h-4 text-accent-400" />
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input-field"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-2"
              >
                <Mail className="w-4 h-4 text-accent-400" />
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-2"
            >
              <FileText className="w-4 h-4 text-accent-400" />
              Subject
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What is this about?"
              className="input-field"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-2"
            >
              <MessageSquare className="w-4 h-4 text-accent-400" />
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us what's on your mind..."
              rows={6}
              className="input-field resize-none"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-400 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "btn-primary w-full flex items-center justify-center gap-2 text-base",
              submitting && "opacity-60 cursor-not-allowed"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Send Message
              </>
            )}
          </button>

          <p className="text-center text-xs text-surface-500">
            We respect your privacy. Your data is never shared with third parties.
          </p>
        </form>
      )}

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Email</p>
            <p className="text-sm text-surface-300 mt-0.5">patelpriyank2526@gmail.com</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Response Time</p>
            <p className="text-sm text-surface-300 mt-0.5">Within 24 hours</p>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
