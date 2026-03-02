import React from "react";
import type { SaveSOAPRequest } from "../../../types/soap";

interface SaveSOAPProps {
  form: SaveSOAPRequest;
  handleSoapDetails: (name : any, value: any) => void;
}

const SaveSOAPForm: React.FC<SaveSOAPProps> = ({
  form,
  handleSoapDetails
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    handleSoapDetails(name, value);
  };

  return (
    <div className="mt-4">
      <form  className="space-y-4 bg-[var(--color-surface-alt)]  ">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Subjective (HPI, ROS, Complaints)
          </label>
          <textarea
            name="subjective"
            placeholder="Patient reports headache starting 3 days ago..."
            value={form.subjective ?? ''}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Objective (Exam Findings & Current Vitals)
          </label>
          <textarea
            name="objective"
            placeholder="Physical exam WNL except for mild tenderness in neck..."
            value={form.objective ?? ''}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Assessment / ICD-10 Code
          </label>
          <textarea
            name="assessment"
            placeholder="Migraine without aura (G43.009)"
            value={form.assessment ?? ''}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Plan (Follow-up, Next Steps, Labs)
          </label>
          <textarea
            name="plan"
            placeholder="Continue current therapy. RTC in 2 weeks or sooner..."
            value={form.plan ?? ''}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={3}
          />
        </div>
      </form>
    </div>
  );
};

export default SaveSOAPForm;
