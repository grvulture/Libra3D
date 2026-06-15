import React, { useState } from "react";
import { Upload, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { MATERIALS, COLORS } from "../data/products";

const CustomOrders = () => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", idea: "",
    material: "PLA", color: "Petrol", quantity: 1, message: "", file: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handle = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.idea) {
      toast.error("Please fill name, email and product idea.");
      return;
    }
    setSubmitted(true);
    toast.success("Custom request submitted. We'll reach out within 24h.");
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-32 text-center text-white">
        <div className="h-16 w-16 mx-auto border border-[#D4A53A] flex items-center justify-center mb-8">
          <CheckCircle2 size={26} className="text-[#D4A53A]" />
        </div>
        <h1 className="font-heading font-black text-3xl lg:text-5xl">Request received.</h1>
        <p className="text-white/75 mt-5 max-w-xl mx-auto">
          Thanks {form.name.split(" ")[0]} — our studio team will review your brief and send a quote to {form.email} within 24 hours.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name:"", email:"", phone:"", idea:"", material:"PLA", color:"Petrol", quantity:1, message:"", file:"" }); }}
          className="btn-ghost-gold mt-10"
          data-testid="custom-reset-btn"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div data-testid="custom-orders-page" className="text-white">
      <section className="border-b border-[#D4A53A]/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12">
          <div className="eyebrow mb-4">Made-to-Order Studio</div>
          <h1 className="font-heading font-black text-4xl lg:text-6xl">Request a Custom 3D Print</h1>
          <p className="text-white/75 mt-4 max-w-2xl">
            Send us a brief — sketch, photo, CAD or just words — and we&apos;ll print
            it for you. Most prototypes ship within a week.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left — instructions */}
          <aside className="lg:col-span-4">
            <div className="border border-[#D4A53A]/20 p-7 bg-[#0F5E60] space-y-6">
              <div>
                <div className="eyebrow mb-2">How it works</div>
                {[
                  { n: "01", t: "Submit brief", b: "Share idea, dimensions and use-case." },
                  { n: "02", t: "Receive quote", b: "We respond within 24h with a price + lead time." },
                  { n: "03", t: "Approve & pay", b: "Pay deposit and we schedule print." },
                  { n: "04", t: "Ship + finish", b: "Hand-finished, packed, tracked." },
                ].map((s) => (
                  <div key={s.n} className="border-t border-[#D4A53A]/15 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[#D4A53A] font-heading font-black">{s.n}</span>
                      <span className="text-white font-heading font-bold">{s.t}</span>
                    </div>
                    <p className="text-white/65 text-sm mt-1">{s.b}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#D4A53A]/15 pt-6">
                <div className="eyebrow mb-3">Accepted formats</div>
                <div className="flex flex-wrap gap-2">
                  {["STL", "STEP", "OBJ", "F3D", "3MF", "Sketch", "Photo"].map((f) => (
                    <span key={f} className="text-[10px] uppercase tracking-[0.2em] border border-[#D4A53A]/30 px-2.5 py-1 text-white/80">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Right — form */}
          <form
            onSubmit={submit}
            data-testid="custom-order-form"
            className="lg:col-span-8 border border-[#D4A53A]/20 bg-[#0F5E60] p-7 lg:p-10 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Name *">
                <input
                  value={form.name}
                  onChange={(e) => handle("name", e.target.value)}
                  data-testid="custom-name"
                  className="brand-input"
                  placeholder="Your name"
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handle("email", e.target.value)}
                  data-testid="custom-email"
                  className="brand-input"
                  placeholder="you@studio.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => handle("phone", e.target.value)}
                  data-testid="custom-phone"
                  className="brand-input"
                  placeholder="+49 ..."
                />
              </Field>
              <Field label="Quantity">
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => handle("quantity", +e.target.value)}
                  data-testid="custom-quantity"
                  className="brand-input"
                />
              </Field>
            </div>

            <Field label="Product idea *">
              <input
                value={form.idea}
                onChange={(e) => handle("idea", e.target.value)}
                data-testid="custom-idea"
                className="brand-input"
                placeholder="e.g. Replacement knob for vintage radio"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Material preference">
                <select
                  value={form.material}
                  onChange={(e) => handle("material", e.target.value)}
                  data-testid="custom-material"
                  className="brand-input"
                >
                  {MATERIALS.map((m) => <option key={m} value={m} className="bg-[#0F5E60]">{m}</option>)}
                </select>
              </Field>
              <Field label="Color preference">
                <select
                  value={form.color}
                  onChange={(e) => handle("color", e.target.value)}
                  data-testid="custom-color"
                  className="brand-input"
                >
                  {COLORS.map((c) => <option key={c.name} value={c.name} className="bg-[#0F5E60]">{c.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Upload file (optional)">
              <label
                htmlFor="custom-file"
                className="flex items-center gap-4 border border-dashed border-[#D4A53A]/40 p-5 cursor-pointer hover:border-[#D4A53A] transition-colors"
              >
                <div className="h-12 w-12 border border-[#D4A53A]/40 flex items-center justify-center text-[#D4A53A]">
                  <Upload size={18} />
                </div>
                <div>
                  <div className="text-white text-sm">
                    {form.file ? form.file : "Drop your file or click to upload"}
                  </div>
                  <div className="text-white/55 text-xs mt-1">STL, STEP, OBJ, 3MF, F3D · max 50MB</div>
                </div>
                <input
                  id="custom-file"
                  type="file"
                  className="hidden"
                  data-testid="custom-file"
                  onChange={(e) => handle("file", e.target.files?.[0]?.name || "")}
                />
              </label>
            </Field>

            <Field label="Message">
              <textarea
                value={form.message}
                onChange={(e) => handle("message", e.target.value)}
                data-testid="custom-message"
                rows={5}
                className="brand-input resize-none"
                placeholder="Anything we should know? Deadlines, finishes, use-case..."
              />
            </Field>

            <button type="submit" data-testid="custom-submit" className="btn-gold w-full sm:w-auto">
              <Send size={14} /> Submit Custom Request
            </button>
          </form>
        </div>
      </section>

      <style>{`
        .brand-input {
          width: 100%;
          background: #0A4143;
          border: 1px solid rgba(212,165,58,0.25);
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }
        .brand-input:focus {
          outline: none;
          border-color: #D4A53A;
          box-shadow: 0 0 0 1px rgba(212,165,58,0.4);
        }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{label}</div>
    {children}
  </label>
);

export default CustomOrders;
