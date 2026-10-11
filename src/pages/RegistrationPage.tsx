import { FaPhoneAlt } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { MdPrivacyTip, MdMedicalServices } from "react-icons/md";
import { RiCustomerServiceFill } from "react-icons/ri";
import { BriefcaseMedical, FlaskConical, HeartPulse, Stethoscope } from "lucide-react";
import RegistrationForm from "./Clinic/RegistrationForm";
import '../index.css'

const APP_NAME = "BitCare";
const SUPPORT_PHONE = "9082331713";

const features = [
  { icon: IoMdSettings, title: "Quick setup", description: "Get started in minutes." },
  { icon: MdMedicalServices, title: "Reliable service", description: "Always up and running." },
  { icon: MdPrivacyTip, title: "Secure platform", description: "Your data is protected." },
  { icon: RiCustomerServiceFill, title: "24/7 support", description: "We're here to help anytime." },
];

const Logo = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span
      className={`grid h-9 w-9 place-items-center rounded-xl ${
        light
          ? "bg-white/15 text-white"
          : "bg-[var(--color-primary)] text-[var(--color-surface)]"
      }`}>
      <HeartPulse size={20} aria-hidden />
    </span>
    <span
      className={`text-2xl font-bold tracking-tight ${
        light ? "text-white" : "text-[var(--color-text)]"
      }`}>
      {APP_NAME}
    </span>
  </div>
);

/* Small medical cross used as a floating decoration */
const Cross = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
  </svg>
);

const Registration = () => {
  return (
    /* lg+: exactly one viewport tall, nothing scrolls.
       below lg: normal flow (phones can't fit 9 fields in one screen). */
    <div className="flex min-h-dvh w-full flex-col bg-[var(--color-bg)] lg:h-dvh lg:flex-row lg:overflow-hidden">
      {/* ================= Brand panel (desktop) ================= */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-primary)] p-8 text-white lg:flex lg:w-[40%] xl:p-12">
        {/* decorative animated shapes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* the two big circles, now floating */}
          <span className="anim-float-a absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <span className="anim-float-b absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/5" />

          {/* pulsing halo inside the top-right circle */}
          <span className="anim-pulse absolute right-10 top-10 h-40 w-40 rounded-full border border-white/15" />

          {/* slow rotating dashed ring */}
          <span className="anim-spin-slow absolute right-24 top-[46%] h-28 w-28 rounded-full border border-dashed border-white/20" />

          {/* drifting dot grid */}
          <span className="dot-grid anim-drift absolute bottom-40 right-12 h-24 w-24 text-white/25" />

          {/* tiny crosses */}
          <Stethoscope className="anim-bob absolute left-[46%] top-24 h-10 w-10 text-white/70" />
          <BriefcaseMedical  className="anim-bob delay-n3s absolute bottom-24 right-[22%] h-7 w-7 text-white/70" />
        </div>

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative">
          <h1
            className="font-[var(--font-weight-bold)] leading-tight"
            style={{ fontSize: "var(--font-h2, 2.25rem)" }}>
            Register <span className="text-white/70">yourself</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm text-white/80 xl:text-base">
            Join our network of healthcare providers and start delivering
            exceptional care to your community.
          </p>

          <ul className="mt-6 grid grid-cols-1 gap-3 xl:mt-8 xl:gap-4">
            {features.map(({ icon: Icon, title, description }, i) => (
              <li
                key={title}
                style={{ animationDelay: `${i * 90 + 150}ms` }}
                className="anim-fade-up flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-white/75">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <a
          href={`tel:${SUPPORT_PHONE}`}
          className="relative flex w-fit items-center gap-3 rounded-full bg-white/15 py-2 pl-2 pr-5 text-sm hover:bg-white/20">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--color-primary)]">
            <FaPhoneAlt size={14} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-xs text-white/75">Need help?</span>
            <span className="block font-semibold">{SUPPORT_PHONE}</span>
          </span>
        </a>
      </aside>

      {/* ================= Form side ================= */}
      {/* Wrapper holds the decorative layer BEHIND the scrolling <main>,
          so the shapes stay still while the form scrolls. */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* decorative background (behind the form) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* top-left blob, peeks out beside the card */}
          {/* <span className="anim-float-a absolute left-14 -top-54 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]" />
          <span className="anim-pulse absolute left-36 top-36 h-32 w-32 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]" /> */}

          {/* bottom-right blobs */}
          {/* <span className="anim-float-b absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]" />
          <span className="anim-float-a delay-n6s absolute bottom-10 right-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)]" />
          <span className="anim-spin-slow absolute bottom-24 right-[18%] h-24 w-24 rounded-full border border-dashed border-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]" /> */}

          {/* dot grids + crosses */}
          <span className="dot-grid anim-drift absolute left-8 top-[38%] h-24 w-24 text-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]" />
          <span className="dot-grid anim-drift delay-n5s absolute bottom-16 left-[30%] hidden h-20 w-20 text-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] lg:block" />
          <Cross className="anim-bob absolute right-[12%] top-16 h-8 w-8 text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]" />
          <FlaskConical  className="anim-bob delay-n3s absolute bottom-[26%] left-[12%] h-8 w-8 text-[color-mix(in_srgb,var(--color-primary)_82%,transparent)]" />
        </div>

        <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* compact top bar (mobile / tablet) */}
          <header className="flex items-center justify-between px-4 py-3 sm:px-8 lg:hidden">
            <Logo />
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]"
              aria-label={`Call support at ${SUPPORT_PHONE}`}>
              <FaPhoneAlt
                className="text-[var(--color-primary)]"
                size={13}
                aria-hidden
              />
              <span className="hidden min-[360px]:inline">{SUPPORT_PHONE}</span>
            </a>
          </header>

          {/* m-auto centers when there is spare room and never clips the top */}
          <div className="m-auto w-full px-3 pb-6 pt-1 sm:px-6 lg:px-8 lg:py-4">
            <div className="mx-auto mb-3 max-w-xl text-center lg:hidden">
              <h1
                className="font-[var(--font-weight-bold)] text-[var(--color-text)]"
                style={{ fontSize: "var(--font-h3, 1.5rem)" }}>
                Register{" "}
                <span className="text-[var(--color-primary)]">yourself</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Join our network of healthcare providers and start delivering
                exceptional care.
              </p>
            </div>

            {/* fade-up entrance for the form card */}
            <div className="anim-fade-up">
              <RegistrationForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Registration;