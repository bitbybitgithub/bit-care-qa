import Regex, { regex } from "../context/Regex";
import type { FormDataBase } from "../types/types";

export type Errors = Partial<Record<keyof FormDataBase, string>>;

export const validateRegistration = (form: FormDataBase): Errors => {
  const errors: Errors = {};
  if (!form.name?.trim()) {errors.name = "Name is required";} 
  if (form.name && form.name.length < 5){errors.name = "Name must be at least 5 characters long";}
  if (!regex.name.test(form.name)) {errors.name ="Cannot Enter numbers or special characters";}
  if (!form.email?.trim()) errors.email = "Email is required";
  if (form.email && !Regex.email.test(form.email)) {errors.email = "Email is not valid";}
  if (!form.phone?.trim()) errors.phone = "Contact No. required";
  if (form.phone && !regex.mobile.test(form.phone)) {errors.phone = "must be 10 digits";}
  if (!form.PINCode?.trim()) errors.PINCode = "Pincode is required";
  if (form.PINCode && !Regex.pincode.test(form.PINCode)) {errors.PINCode = "must be a number";}
  if (!form.state?.trim()) errors.state = "Select State";
  if (!form.district?.trim()) errors.district = "Select District";
  if (!form.area?.trim()) errors.area = "Select Area";
  if (form.address && form.address.length <10){errors.address = "Address must be at least 10 characters";}
  if (!form.address?.trim()) errors.address = "Enter Your Clinic Address";

  return errors;
};
