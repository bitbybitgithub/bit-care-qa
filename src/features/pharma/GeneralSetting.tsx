import React, { useEffect, useState } from "react";
import UploadControl from "../../components/common/UploadControl";
import { type PharmaProfileInfoResponse } from "../../types/pharmacyType/pharmacyInterfaceType";
import { savePharmaProfileInfo } from "../../api/pharmacyApi/PharmacyApi";
import { toast } from "react-toastify";
import { getSessionItem } from "../../context/sessions/userSession";
import { TextField } from "@mui/material";

interface GeneralSettingProps {
  profile: PharmaProfileInfoResponse;
  setProfile: React.Dispatch<
    React.SetStateAction<PharmaProfileInfoResponse | null>
  >;
}

const GeneralSetting: React.FC<GeneralSettingProps> = ({
  profile,
  setProfile,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [pharmaLogoFile, setPharmaLogoFile] = useState<File | null>(null);
  const [fileerror, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const pharmacy_id = Number(getSessionItem("user", "pharmacy_id"));

  useEffect(() => {
    if (profile?.pharma_logo) {
      setPreview(
        profile.pharma_logo.startsWith("data:image")
          ? profile.pharma_logo
          : `data:image/jpeg;base64,${profile.pharma_logo}`
      );
    }
  }, [profile]);

  const fullAddress = profile
    ? [
        profile.address,
        profile.city,
        profile.district,
        profile.state,
        profile.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const handleFileChange = (file: File | null) => {
    if (file) {
      setPharmaLogoFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setPharmaLogoFile(null);
      setPreview(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!pharmaLogoFile) {
      toast.error("Please select a logo");
      return;
    }

    try {
      setLoading(true);

      const response = await savePharmaProfileInfo(
        pharmacy_id,
        pharmaLogoFile
      );

      if (response.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(response.message);
      }

    } catch (error) {
      toast.error("Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-red-500">Profile not found</p>
      </div>
    );
  }

  return (
    <>
    <div className="p-3">
      <section className="mb-4">
        <h3 className="font-semibold text-blue-600 mb-2">
          Pharmacy Branding
        </h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 flex items-center justify-center border-2 border-dashed rounded-lg bg-gray-100 overflow-hidden">
            {preview ? (
              <img
                src={preview}
                alt="Pharmacy Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-gray-500">Logo</span>
            )}
          </div>

          {!profile.pharma_logo && (
            <div className="flex flex-col w-full mt-6">
              <UploadControl
                controlName="pharmacyLogo"
                file={pharmaLogoFile}
                onFileChange={handleFileChange}
                onError={setFileError}
                acceptedFileTypes=".jpg,.jpeg,.png,.svg"
                maxSizeMB={5}
                height="50px"
              />
              {fileerror && (
                <p className="text-red-500 text-sm">
                  {fileerror}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          Pharmacy Name
        </label>
        <TextField
          type="text"
          disabled
          value={profile.pharma_name}
          className="w-96 border rounded-md px-3 py-2 border-blue-600 bg-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">
            Email Address
          </label>
          <TextField
            type="email"
            disabled
            value={profile.email}
            className="w-full border rounded-md px-3 py-2 border-blue-600 bg-gray-100"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            Phone Number
          </label>
          <TextField
            type="text"
            disabled
            value={profile.phone}
            className="w-full border rounded-md px-3 py-2 border-blue-600 bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1">
          Address
        </label>
        <TextField
          multiline
          disabled
          value={fullAddress}
          className="w-3/5 border rounded-md px-3 py-2 border-blue-600 bg-gray-100"
        />
      </div>
      <div>
        <div className="mt-6">
  <button
    onClick={handleSaveProfile}
    disabled={loading}
    className={`px-6 py-2 rounded-md text-white transition ${
      loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700"
    }`}
  >
    {loading ? "Saving..." : "Save & Complete"}
  </button>
</div>

      </div>
    </div>
    </>
  );
};

export default GeneralSetting;
