 export  function getNextFollowupDate(
    appointmentDate: string | null,
    duration: string | number | null
  ): string {
    if (!appointmentDate) return "-";

    // convert duration to a number (default 6 if invalid)
    const days = Number(duration) || 6;

    const date = new Date(appointmentDate);
    date.setDate(date.getDate() + days);

    return date.toLocaleDateString();
  }

 export  function calculateAge(dob: string | null): number | string {
    if (!dob) return "-"; // if dob missing
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust if birthday hasn’t occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : "-";
  }
