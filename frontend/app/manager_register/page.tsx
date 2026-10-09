"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {HeartHandshake,User,Mail,Phone,Lock,Eye,EyeOff,Briefcase,Building2,MapPin,FileText,ShieldCheck,} from "lucide-react";
import { apiRequest } from "../../lib/api";
export default function ManagerRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", occupation: "", organization: "", designation: "", workLocation: "", reason: "", password: "", confirmPassword: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please confirm the manager terms and conditions.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          occupation: form.occupation,
          address: form.workLocation,
          role: "manager",
        }),
      });
      setSuccess("Manager application submitted. An administrator must approve your account before access is granted.");
      setTimeout(() => router.push("/login"), 1400);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Manager registration failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><HeartHandshake size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-emerald-700">HelpBridge</h1>
              <p className="text-xs text-slate-500">Bridging Help. Changing Lives.</p>
            </div>
          </Link>
          <Link href="/login" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Back to Login</Link>

        </div>

        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="hidden bg-gradient-to-br from-emerald-700 to-teal-800 p-10 text-white lg:block">
            <div className="sticky top-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <ShieldCheck size={30} />
              </div>
              <h2 className="mt-8 text-4xl font-extrabold leading-tight">
                Become a<br />HelpBridge<br />Manager</h2>
              <p className="mt-5 leading-7 text-emerald-50">Managers play an important role in verifying emergencyrequests and coordinating suitable help providers.</p>
              <div className="mt-10 space-y-6">
                <InfoItem number="01" title="Submit Application" description="Provide your professional and contact information."/>
                <InfoItem number="02" title="Administrator Verification" description="Your application will be reviewed by an administrator."/>
                <InfoItem number="03" title="Start Managing" description="After approval, you can access the Manager Dashboard."/>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <ShieldCheck size={17} />Manager Application
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Manager Registration</h2>
                <p className="mt-2 text-slate-500">Submit your details to request Manager access,</p>
              </div>

              <div className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-amber-600" size={20}/>
                  <div>
                    <h3 className="font-bold text-amber-800">Administrator Approval Required</h3>
                    <p className="mt-1 text-sm leading-6 text-amber-700">Manager accounts cannot be activated immediately.
                      After registration, an administrator must verify and  approve your application before you can access the  Manager Dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <form className="space-y-7" onSubmit={handleSubmit}>
                <section>
                  <h3 className="mb-4 text-lg font-bold text-slate-800"> Personal Information</h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField label="Full Name" placeholder="Enter your full name" icon={<User size={18} />}type="text" value={form.name} onChange={(value) => updateField("name", value)} required/>
                    <InputField label="Email" placeholder="Enter your email" icon={<Mail size={18} />}type="email" value={form.email} onChange={(value) => updateField("email", value)} required/>
                    <InputField label="Phone Number" placeholder="Enter your phone number" icon={<Phone size={18} />}type="tel" value={form.phone} onChange={(value) => updateField("phone", value)} required/>
                    <InputField label="Occupation" placeholder="Enter your occupation" icon={<Briefcase size={18} />}type="text" value={form.occupation} onChange={(value) => updateField("occupation", value)} required/>
                  </div>
                </section>
                <section>
                  <h3 className="mb-4 text-lg font-bold text-slate-800">Professional Information</h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField label="Organization / Department" placeholder="Enter organization" icon={<Building2 size={18} />} type="text" value={form.organization} onChange={(value) => updateField("organization", value)} required/>
                    <InputField label="Designation" placeholder="Enter designation" icon={<Briefcase size={18} />}type="text" value={form.designation} onChange={(value) => updateField("designation", value)} required/>
                  </div>
                </section>
                <section>
                  <h3 className="mb-4 text-lg font-bold text-slate-800">Location</h3>
                    <InputField label="Work Location / Area" placeholder="Enter your working area" icon={<MapPin size={18} />}type="text" value={form.workLocation} onChange={(value) => updateField("workLocation", value)} required/>
                </section>
                <section>
                  <h3 className="mb-4 text-lg font-bold text-slate-800">Application Details</h3>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Why do you want to become a HelpBridge Manager?</label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-4 top-4 text-slate-400"/>
                    <textarea required rows={4} value={form.reason} onChange={(event) => updateField("reason", event.target.value)} placeholder="Explain your experience and reason for applying..." className="w-full resize-none rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                  </div>
                </section>
                <section>
                  <h3 className="mb-4 text-lg font-bold text-slate-800">Account Security</h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input required minLength={8} value={form.password} onChange={(event) => updateField("password", event.target.value)} type={showPassword ? "text" : "password"} placeholder="Create a password" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input required value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} type={showConfirmPassword? "text": "password"}placeholder="Confirm password"
                          className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showConfirmPassword ? (<EyeOff size={18} />) : (<Eye size={18} />)}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="flex items-start gap-3">
                    <input required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"/>
                    <span className="text-sm leading-6 text-slate-600">I confirm that the information provided is accurate and I agree to HelpBridge{"'"}sManager Terms and Conditions.</span>
                  </label>
                </div>
                {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
                <button disabled={loading} type="submit" className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Submitting Application..." : "Submit Manager Application"}</button>
                <p className="text-center text-sm text-slate-500">Already have an account?{" "}
                  <Link href="/login" className="font-bold text-emerald-600">Login</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
function InputField({ label,placeholder,icon,type,value,onChange,required,}: {label: string;placeholder: string;icon: React.ReactNode;type: string;value?: string;onChange?: (value: string) => void;required?: boolean;}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input required={required} type={type} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
      </div>
    </div>
  );
}

function InfoItem({number,title,description,}: {number: string;title: string;description: string;}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">{number}
      </div>
      <div>
        <h3 className="font-bold">{title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-emerald-100">{description}
        </p>
      </div>
    </div>
  );
}
