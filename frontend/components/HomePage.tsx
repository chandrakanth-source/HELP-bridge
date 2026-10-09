"use client";
import {ArrowRight,Car,CheckCircle,HeartHandshake,MapPin,Menu,MessageCircle,ShieldCheck,Siren,Users,X,} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <HeartHandshake size={25} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-emerald-700">HelpBridge</h1>
              <p className="text-xs text-slate-500">Bridging Help. Changing Lives.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#home" className="font-medium text-emerald-700">Home</a>
            <a href="#how-it-works"className="font-medium text-slate-600 transition hover:text-emerald-600">How It Works</a>
            <a href="#services" className="font-medium text-slate-600 transition hover:text-emerald-600">Services</a>
            <a href="#about" className="font-medium text-slate-600 transition hover:text-emerald-600">About Us</a>
            <a href="#contact" className="font-medium text-slate-600 transition hover:text-emerald-600">Contact</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a href="/login" className="rounded-lg border border-emerald-600 px-6 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-50">Login</a>
            <a href="/register" className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-md transition hover:bg-emerald-700">Register</a>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border p-2 lg:hidden">{menuOpen ? <X /> : <Menu />}</button>
        </div>

        {menuOpen && (
          <div className="absolute top-full left-0 w-full border-t bg-white px-6 py-5 shadow-lg lg:hidden z-50">
            <div className="flex flex-col gap-4">
              <a href="#home">Hom</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#services">Services</a>
              <a href="#about"> About Us</a>
              <a href="#contact">Contact</a>
              <a href="/login" className="rounded-lg border border-emerald-600 px-5 py-2 text-center font-semibold text-emerald-700">Login</a>
              <a href="/register" className="rounded-lg bg-emerald-600 px-5 py-2 text-center font-semibold text-white">Register</a>
            </div>
          </div>
        )}
      </header>

      <section id="home" className="overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />Help is just a bridge away
            </div>
            <h2 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">Connecting People
              <br />
              Who{" "}
              <span className="text-emerald-600">Need Help</span>
              <br />
              With People
              <br />
              Who{" "}
              <span className="text-emerald-600">Can Help</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              HelpBridge is a mediator platform that connects help
              seekers with trusted help providers for both emergency
              and non-emergency needs.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href="/sos" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-4 font-bold text-white shadow-lg transition hover:bg-emerald-700">
                <Siren size={20} />Request Help
                <ArrowRight size={18} /></a>
              <a href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-white px-7 py-4 font-bold text-emerald-700 transition hover:bg-emerald-50">
                <Users size={20} />Become a Provider
              </a>
            </div>
          </div>

          <div className="relative flex min-h-[480px] items-center justify-center">
            <div className="absolute h-[380px] w-[380px] rounded-full bg-emerald-100 md:h-[450px] md:w-[450px]" />
            <div className="absolute left-5 top-32 z-10">
              <div className="relative">
                <div className="flex h-28 w-24 items-end justify-center rounded-t-full bg-slate-800">
                  <div className="absolute -top-10 h-16 w-16 rounded-full bg-amber-200" />
                </div>
                <div className="mx-auto h-32 w-16 rounded-b-2xl bg-emerald-600" />
              </div>
            </div>

            {/*image*/}
            <div className="absolute left-12 top-16 z-20 rounded-xl bg-red-500 px-5 py-3 font-bold text-white shadow-lg">HELP!</div>
            <div className="absolute left-40 top-32 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg">
              <MapPin />
            </div>
            <div className="absolute right-24 top-40 z-10">
              <div className="relative">
                <div className="absolute -top-10 left-6 h-16 w-16 rounded-full bg-amber-200" />
                <div className="h-32 w-28 rounded-t-[40px] bg-emerald-700" />
                <div className="h-8 w-32 rounded-full bg-slate-800" />
              </div>
            </div>
            <div className="absolute right-12 top-28 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
              <CheckCircle size={30} />
            </div>
            <div className="absolute left-32 top-56 h-1 w-64 rotate-6 border-t-4 border-dashed border-emerald-500" />
            <div className="absolute bottom-8 right-0 h-[300px] w-[155px] rotate-3 rounded-[30px] border-8 border-slate-800 bg-white shadow-2xl">
              <div className="flex h-full items-center justify-center rounded-[20px] bg-slate-100">
                <div className="relative h-52 w-28">
                  <div className="absolute left-4 top-10 h-32 w-1 rotate-45 bg-emerald-500" />
                  <MapPin className="absolute left-12 top-4 text-red-500" size={30}/>
                  <MapPin className="absolute bottom-2 left-3 text-red-500" size={30}/>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid overflow-hidden rounded-2xl border bg-white shadow-lg md:grid-cols-3">
            <ServiceCard icon={<Siren />} title="Emergency Help" description="Disasters, accidents, medical, blood & more" iconClass="bg-red-50 text-red-500"/>
            <ServiceCard icon={<Car />} title="Non-Emergency Help" description="Car breakdown, towing, lockout & more" iconClass="bg-amber-50 text-amber-600"/>
            <ServiceCard icon={<ShieldCheck />} title="Safe & Trusted" description="Verified providers and secure assistance" iconClass="bg-blue-50 text-blue-600"/>
          </div>
        </div>
      </section>

      <section id="services"className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">We Are Here to Help</h2>
            <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-emerald-600" />
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <RoleCard icon={<Users />} title="For Help Seekers" description="Request help in emergency or non-emergency situations quickly and easily."/>
            <RoleCard icon={<HeartHandshake />} title="For Help Providers" description="Assist people in need and earn by providing help in your area."/>
            <RoleCard icon={<ShieldCheck />} title="For Managers" description="Review and verify emergency requests to ensure the right help reaches the right people."/>
            <RoleCard icon={<ShieldCheck />} title="For Administrators" description="Monitor, manage and ensure smooth operations across the platform."/>
          </div>

          <div className="mt-10 grid rounded-2xl border bg-white p-8 shadow-sm md:grid-cols-4">
            <Stat icon={<Users />} value="10K+" label="Happy Users"/>
            <Stat icon={<HeartHandshake />}value="5K+" label="Help Provided"/>
            <Stat icon={<ShieldCheck />} value="2K+" label="Verified Providers"/>
            <Stat icon={<CheckCircle />} value="98%" label="Satisfaction Rate"/>
          </div>
        </div>
      </section>

      <section    id="how-it-works" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold">How HelpBridge Works</h2>
            <p className="mt-3 text-slate-600">Simple, fast and reliable assistance.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            <Step number="01" title="Request Help" description="Tell us what kind of assistance you need."/>
            <Step number="02" title="Verification"  description="Emergency requests are reviewed by our manager."/>
            <Step number="03" title="Get Matched"  description="We connect you with a suitable nearby provider."/>
            <Step number="04" title="Receive Help" description="Communicate, receive assistance and complete payment securely."/>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">HelpBridge</h2>
            <p className="mt-2 max-w-md text-slate-400">Bridging people who need help with people who can help.</p>
          </div>
          <div className="text-sm text-slate-400">© 2026 HelpBridge. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}

function ServiceCard({icon,title,description,iconClass,}: {icon: React.ReactNode;title: string;description: string;iconClass: string;}) {
  return (
    <div className="flex items-start gap-4 border-b p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function RoleCard({ icon,title,description}: {icon: React.ReactNode;title: string;description: string;}) {
  return (
    <div className="rounded-2xl border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function Stat({ icon,value,label,}: {icon: React.ReactNode;value:string;label:string;}) {
  return (
    <div className="flex items-center gap-4 border-b p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="text-emerald-600">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Step({ number,title,description}: {number: string;title: string;description: string;}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white shadow-lg">{number}</div>
      <h3 className="mt-5 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
