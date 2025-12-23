import { FaPhoneAlt } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { MdPrivacyTip, MdMedicalServices } from "react-icons/md";
import { HeartPulse } from "lucide-react";
import RegistrationForm from "./Clinic/RegistrationForm";
import { RiCustomerServiceFill } from "react-icons/ri";

const Registration = () => {
  const features = [
    {
      icon: IoMdSettings,
      title: "Quick Setup",
      description: "Get started in minutes.",
    },
    {
      icon: MdMedicalServices,
      title: "Reliable Service",
      description: "Always up and running.",
    },
    {
      icon: MdPrivacyTip,
      title: "Secure Platform",
      description: "Your data is protected.",
    },
    {
      icon: RiCustomerServiceFill,
      title: "24/7 Support",
      description: "We’re here to help anytime.",
    },
  ];

  return (
    <div className="bg-[var(--color-surface)] lg:min-h-screen min-w-full lg:flex lg:flex-row flex flex-col-reverse items-center justify-center px-2 lg:px-20 gap-x-2">
      {/* Left Image Section */}
      <div className="relative w-full flex justify-center items-center h-auto lg:h-auto lg:w-[50%] p-2 border-b-2 border-[var(--color-primary)] ">
        <div>
          <h1
            className="font-[var(--font-weight-bold)] hidden lg:block mb-5"
            style={{ fontSize: "var(--font-h1)" }}
          >
            Register Your{" "}
            <span className="text-[var(--color-primary)]">Centre</span>
          </h1>

          <p className="text-center lg:text-start">
            Join Our network of healthcare providers and start delivering
            exceptional care to your community.
          </p>

          <div className="grid grid-cols-2 gap-y-10 gap-x-5 my-5 text-[var(--color-text)] p-3 bg-error">
            {features.map(({ icon: Icon, title, description }, index) => (
              <div
                key={index}
                className="bg-[var(--color-bg)] p-4 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border-t-2 border-[var(--color-primary)]"
              >
                <Icon className="text-xl" />
                <h3 className="mt-2 font-semibold text-[var(--color-primary)]">
                  {title}
                </h3>
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
              <FaPhoneAlt className="text-[var(--color-text)]" /> Call :
              9900990099
            </h3>
          </div>

          <HeartPulse className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[var(--color-primary)] w-20 h-20 animate-pulse" />
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full p-2 lg:p-5 lg:h-auto  lg:w-[50%]">
        <RegistrationForm />
      </div>
    </div>
  );
};

export default Registration;
