import React from "react";

interface props {
  form: any;
  handlePrescriptionChange: (val : any) => void;
}

const DoctEPrescription: React.FC<props> = ({form,handlePrescriptionChange}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handlePrescriptionChange(value)
  };
  return (

      <div className="mt-4">
        {/* className=" w-full m-4 p-6 bg-[var(--color-white)]  rounded-2xl shadow-lg border border-gray-200"> */}
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Rx(Prescription Entry)
            </label>
            <textarea
              name="notes"
              value={form?.prescription}
              onChange={handleChange}
              placeholder="e.g., Atorvastatin 20mg, 1 tablet PO nightly. Take for 30 days."
              rows={4}
              className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            />

            {/* Capture and Print Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 my-4">
              <button className="flex-1 border border-green-500 text-green-600 rounded-md py-2 hover:bg-green-50 transition">
                Capture from Device
              </button>
              <button className="flex-1 border border-gray-400 text-gray-600 rounded-md py-2 hover:bg-gray-100 transition">
                Print Prescription
              </button>
            </div>
      </div>
  );
};

export default DoctEPrescription;
