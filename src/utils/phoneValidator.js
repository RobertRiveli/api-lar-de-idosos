import parsePhoneNumberFromString from "libphonenumber-js";

export function validatePhone(phone) {
  if (!phone) return false;

  const parsedPhone = parsePhoneNumberFromString(phone, "BR");

  if (!parsedPhone) return false;

  return parsedPhone.isValid();
}
