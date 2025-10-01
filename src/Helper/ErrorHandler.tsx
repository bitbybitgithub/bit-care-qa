import Regex, { regex } from "../context/Regex";
import type { FormDataBase } from "../types/types";

export type Errors = Partial<Record<keyof FormDataBase, string>>;

export const validateRegistration = (form: FormDataBase): Errors => {
  const errors: Errors = {};
  if (!form.name?.trim()) errors.name = "Name is required";
  if (!form.email?.trim()) errors.email = "Email is required";
  if (!form.PINCode?.trim()) errors.PINCode = "Pincode is required";
    if (form.phone && !regex.mobile.test(form.phone)) {
    errors.phone = "must be 10 digits";
  }
  if (!form.phone?.trim()) errors.phone = "Contact No. required";
  if (form.email && !Regex.email.test(form.email)) {
    errors.email = "email is not valid";
  }
  if (form.PINCode && !Regex.pincode.test(form.PINCode)) {
    errors.PINCode = "must be a number";
  }

  return errors;
};
