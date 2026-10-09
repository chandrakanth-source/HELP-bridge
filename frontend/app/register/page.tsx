"use client";
import Link from "next/link";
import { useState } from "react";
import {HeartHandshake,User,Mail,Phone,Lock, Eye,EyeOff,MapPin,Briefcase,ShieldCheck,} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
export default function RegisterPage() {
  const [showPassword, setShowPassword]=useState(false);
  const [showConfirmPassword, setShowConfirmPassword]=useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", occupation: "", password: "", confirmPassword: "", blood_group: "", address: "" });
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
      setError("Please accept the Terms of Service and Privacy Policy.");
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
          blood_group: form.blood_group || null,
          address: form.address || null,
          role: "user",
        }),
      });
      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-700">HelpBridge</h1>
              <p className="text-xs text-slate-500">Bridging Help. Changing Lives.</p>
            </div>
          </Link>

          <p className="hidden text-sm text-slate-500 sm:block">  Already have an account?{" "}
            <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700">Login</Link>
          </p>
        </div>
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="hidden bg-gradient-to-br from-emerald-700 to-teal-800 p-10 text-white lg:block">
            <div className="sticky top-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <ShieldCheck size={30} />
              </div>
              <h2 className="mt-8 text-4xl font-extrabold leading-tight">Join
                <br />
                HelpBridge
              </h2>
              <p className="mt-5 leading-7 text-emerald-50">Create your account and become part of a platform that connects people who need help with people who can provide it.</p>
              <div className="mt-10 space-y-6">
                <InfoItem title="Request Help" description="Get assistance during emergency and non-emergency situations."/>
                <InfoItem title="Become a Provider" description="Help people in your area and earn through verified assistance."/>
                <InfoItem title="Safe & Trusted" description="Your information is protected and users are verified."/>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Create Your Account</h2>
                <p className="mt-2 text-slate-500">Join HelpBridge and get help or provide help to others.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    ✓ Seeker Mode (Request Emergency & Non-Emergency Help)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    ✓ Provider Mode (Earn & Help Neighbors in Need)
                  </span>
                </div>
              </div>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <h3 className="mb-4 text-lg font-bold text-slate-800">Personal Information</h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField label="Full Name" placeholder="Enter your full name" icon={<User size={18} />} type="text" value={form.name} onChange={(value) => updateField("name", value)} required/>
                    <InputField label="Email" placeholder="Enter your email" icon={<Mail size={18} />} type="email" value={form.email} onChange={(value) => updateField("email", value)} required/>
                    <InputField label="Phone Number" placeholder="Enter your phone number" icon={<Phone size={18} />}type="tel" value={form.phone} onChange={(value) => updateField("phone", value)} required/>
                    <InputField label="Occupation" placeholder="Enter your occupation" icon={<Briefcase size={18} />} type="text" value={form.occupation} onChange={(value) => updateField("occupation", value)}/>
                  </div>
                </div>
                <div>
                  <h3 className="mb-4 text-lg font-bold text-slate-800">Account Security</h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input required minLength={8} value={form.password} onChange={(event) => updateField("password", event.target.value)} type={showPassword ? "text" : "password"} placeholder="Create a password" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                        <button type="button" onClick={() =>setShowPassword(!showPassword)}className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? (<EyeOff size={18} />) : (<Eye size={18} />)}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input required value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} type={showConfirmPassword? "text": "password"}placeholder="Confirm your password"
                          className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showConfirmPassword ? (<EyeOff size={18} />) : (<Eye size={18} />)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-bold text-slate-800">Help & Location Information</h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Blood Group</label>
                      <select value={form.blood_group} onChange={(event) => updateField("blood_group", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                        <option value="" disabled>Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <InputField label="City / Area" placeholder="Enter your city or area" icon={<MapPin size={18} />} type="text"/>
                  </div>
                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                    <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Enter your full address" rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                  </div>
                  <button type="button" className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                    <MapPin size={18} />Use my current location
                  </button>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="flex items-start gap-3">
                    <input required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"/>
                    <span className="text-sm leading-6 text-slate-600">I agree to the{" "}
                      <a href="#" className="font-semibold text-emerald-600">Terms of Service</a>{" "}and{" "}
                      <a href="#" className="font-semibold text-emerald-600"> Privacy Policy </a>.
                    </span>
                  </label>
                </div>

                {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
                <button disabled={loading} type="submit" className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Creating Account..." : "Create Account"}</button>
                <p className="text-center text-sm text-slate-500 sm:hidden">Already have an account?{" "}
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

function InputField({label,placeholder,icon,type,value,onChange,required,}: {label: string;placeholder: string;icon: React.ReactNode;type: string;value?: string;onChange?: (value: string) => void;required?: boolean;}) {
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
function InfoItem({ title,description,}: {title: string;description: string;}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm">✓</div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-emerald-100">{description}</p>
      </div>
    </div>
  );
}
