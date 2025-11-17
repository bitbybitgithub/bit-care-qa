export const getAge = (dob?: string | number | Date): number | string => {
  if (!dob) return "--";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "--";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
};
