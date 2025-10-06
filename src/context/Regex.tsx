import type { RegexCollection } from "../types/types";

export const regex: RegexCollection = {
  mobile: /^[6-9][0-9]{9}$/,
  email: /^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/,
  pincode: /^[1-9][0-9]{5}$/,
  name: /^[A-Za-z\s]{1,50}$/,
  state: /^[A-Za-z\s]{2,50}$/,
  district: /^[A-Za-z\s]{2,50}$/,
  area: /^[A-Za-z\s]{2,50}$/,
  address: /^[A-Za-z0-9\s,.-]{10,100}$/,
};

const Regex = {
  MOBILEREGEX : /^[6-9][0-9]{9}$/,
  email: /^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/,
  username: /^[a-zA-Z0-9_]{3,16}$/,
  pincode: /^[1-9][0-9]{5}$/,
  name: /^[A-Za-z\s]{1,50}$/,
  numeric: /^\d+$/,
  alphabets: /^[A-Za-z]+$/,
  address: /^[A-Za-z0-9\s,.-]{10,100}$/,
};
export default Regex;
