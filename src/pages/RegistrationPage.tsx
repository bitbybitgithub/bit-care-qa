import { FaHospital, FaPhoneAlt } from "react-icons/fa";
import { HeartPulse } from "lucide-react";
import RegistrationForm from "./Clinic/RegistrationForm";

const Registration = () => {
  const features = [
    { icon: FaHospital, title: "Quick Setup", description: "Get started in minutes.", bg: "var(--color-info)" },
    { icon: FaHospital, title: "Reliable Service", description: "Always up and running.", bg: "var(--color-error)" },
    { icon: FaHospital, title: "Secure Platform", description: "Your data is protected.", bg: "var(--color-success)" },
    { icon: FaHospital, title: "24/7 Support", description: "We’re here to help anytime.", bg: "var(--color-warning)" },
  ];
 
  return (
    <div className="bg-[var(--color-surface)] md:min-h-screen min-w-full md:flex md:flex-row flex flex-col items-center justify-center px-2 md:px-30 gap-x-2">
      {/* Left Image Section */}
      <div className="relative w-full md:w-[50%] md:h-[80vh] p-2 border-b-2 border-[var(--color-primary)]">
        <h1
          className="font-[var(--font-weight-bold)] bg-text mb-5"
          style={{ fontSize: "var(--font-h1)" }}
        >
          Register Your{" "}
          <span className="text-[var(--color-primary)]">Clinic</span>
        </h1>

        <p>
          Join Our network of healthcare providers and start delivering exceptional
          care to your community.
        </p>

        <div className="grid grid-cols-2 gap-y-10 gap-x-5 my-5 text-[var(--color-text)] p-3 bg-error">
          {features.map(({ icon: Icon, title, description, bg }, index) => (
            <div
              key={index}
              style={localStorage.getItem("theme") === "light" ? { backgroundColor: bg } : {}}
              className="bg-[var(--color-bg)] p-4 rounded-[var(--radius-lg)] shadow-md border-b-2 border-[var(--color-primary)]"
            >
              <Icon />
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="text-sm">{description}</p>
            </div>
          ))}
        </div>

        <div>
          <h1
            className="font-[var(--font-weight-bold)] mt-10"
            style={{ fontSize: "var(--font-h3)" }}
          >
            Need <span className="text-[var(--color-primary)]">Help?</span>
          </h1>
          <h3 className="flex justify-start items-center gap-x-2">
            <FaPhoneAlt className="text-[var(--color-text)]" /> Call : 9900990099
          </h3>
        </div>

        <HeartPulse
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[var(--color-primary)] w-20 h-20 animate-pulse"
        />
      </div>

      {/* Right Form Section */}
      <div className="w-full md:w-[50%] p-4">
        <RegistrationForm />
      </div>
    </div>



  );
};

export default Registration;
