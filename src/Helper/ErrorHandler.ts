import Regex, { regex } from "./Regex";
import type { FormDataBase } from "../types/types";

export type Errors = Partial<Record<keyof FormDataBase, string>>;

export const validateRegistration = (form: FormDataBase): Errors => {
  const errors: Errors = {};
 if (!form.name?.trim()) {
  errors.name = "Clinic name is required";
} else if (form.name.trim().length < 2) {
  errors.name = "Clinic name must be at least 5 characters long";
} else if (form.name.trim().length > 50) {
  errors.name = "Clinic name cannot exceed 50 characters";
} else if (!regex.name.test(form.name.trim())) {
  errors.name = "Only alphabets and spaces are allowed";
}

  if (!form.email?.trim()) errors.email = "Email is required";
  if (form.email && !Regex.email.test(form.email)) {errors.email = "Email is not valid";}
  if (!form.phone?.trim()) errors.phone = "Mobile number is required";
  if (form.phone && !regex.mobile.test(form.phone)) {errors.phone = "must be 10 digits";}
  if (!form.PINCode?.trim()) errors.PINCode = "Pincode is required";
  if (form.PINCode && !Regex.pincode.test(form.PINCode)) {errors.PINCode = "must be a number";}
  if (!form.state?.trim()) errors.state = "State is required";
  if (!form.district?.trim()) errors.district = "District is required";
  if (!form.area?.trim()) errors.area = "Area is required";
  if (form.address && form.address.length <10){errors.address = "Address must be at least 10 characters";}
  if (!form.address?.trim()) errors.address = "Clinic Address is required";

  return errors;
};
