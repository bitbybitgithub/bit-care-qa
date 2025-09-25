import Regex from "../context/Regex";
import type { FormDataBase } from "../types/types";

export type Errors = Partial<Record<keyof FormDataBase, string>>;

export const validateRegistration = (form: FormDataBase): Errors => {
  const errors: Errors = {};
  if (!form.name?.trim()) errors.name = "required field";
  if (!form.email?.trim()) errors.email = "required field";
  if (!form.address?.trim()) errors.address = "required field";
  if (!form.strNumber?.trim()) errors.strNumber = "required field";
  if (!form.PINCode?.trim()) errors.PINCode = "required field";
  if (!form.phone?.trim()) errors.phone = "required field";

  if (form.email && !Regex.email.test(form.email)) {
    errors.email = "email is not valid";
  }
  if (form.strNumber && !Regex.MOBILEREGEX.test(form.strNumber)) {
    errors.strNumber = "must be a number";
  }
  if (form.PINCode && !Regex.pincode.test(form.PINCode)) {
    errors.PINCode = "must be a number";
  }
  if (form.phone && !Regex.MOBILEREGEX.test(form.phone)) {
    errors.phone = "must be a number";
  } else if (form.phone && form.phone.length !== 10) {
    errors.phone = "must be 10 digits";
  }
  if (!form.gender) errors.gender = "choose at least one";
  if (!form.type) errors.type = "choose at least one";

  return errors;
};
