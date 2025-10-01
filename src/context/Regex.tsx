import type { RegexCollection } from "../types/types";

export const regex: RegexCollection = {
  mobile: /^[6-9]\d{9}$/,
  password: /^[A-Za-z0-9!@#$%^&*]{6,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  pincode: /^[1-9][0-9]{5}$/,
};

const Regex = {
  MOBILEREGEX : /^[6-9][0-9]{9}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{3,16}$/,
  pincode: /^[1-9][0-9]{5}$/,
  name: /^[A-Za-z ]+$/,
  numeric: /^\d+$/,
  alphabets: /^[A-Za-z]+$/,
};
export default Regex;

