/* data.js — small offline lookups. Country → representative IANA time zone (for
   "current local time / best time to call"). Multi-timezone countries use a
   primary zone and are flagged. Not exhaustive — missing countries degrade to
   "no local time". Pure data, no network. */

export const COUNTRY_TZ = {
  AE: "Asia/Dubai", AF: "Asia/Kabul", AL: "Europe/Tirane", AM: "Asia/Yerevan", AO: "Africa/Luanda",
  AR: "America/Argentina/Buenos_Aires", AT: "Europe/Vienna", AU: "Australia/Sydney", AZ: "Asia/Baku",
  BA: "Europe/Sarajevo", BD: "Asia/Dhaka", BE: "Europe/Brussels", BG: "Europe/Sofia", BH: "Asia/Bahrain",
  BO: "America/La_Paz", BR: "America/Sao_Paulo", BY: "Europe/Minsk", CA: "America/Toronto", CH: "Europe/Zurich",
  CL: "America/Santiago", CM: "Africa/Douala", CN: "Asia/Shanghai", CO: "America/Bogota", CR: "America/Costa_Rica",
  CU: "America/Havana", CY: "Asia/Nicosia", CZ: "Europe/Prague", DE: "Europe/Berlin", DK: "Europe/Copenhagen",
  DO: "America/Santo_Domingo", DZ: "Africa/Algiers", EC: "America/Guayaquil", EE: "Europe/Tallinn",
  EG: "Africa/Cairo", ES: "Europe/Madrid", ET: "Africa/Addis_Ababa", FI: "Europe/Helsinki", FR: "Europe/Paris",
  GB: "Europe/London", GE: "Asia/Tbilisi", GH: "Africa/Accra", GR: "Europe/Athens", GT: "America/Guatemala",
  HK: "Asia/Hong_Kong", HN: "America/Tegucigalpa", HR: "Europe/Zagreb", HU: "Europe/Budapest",
  ID: "Asia/Jakarta", IE: "Europe/Dublin", IL: "Asia/Jerusalem", IN: "Asia/Kolkata", IQ: "Asia/Baghdad",
  IR: "Asia/Tehran", IS: "Atlantic/Reykjavik", IT: "Europe/Rome", JM: "America/Jamaica", JO: "Asia/Amman",
  JP: "Asia/Tokyo", KE: "Africa/Nairobi", KH: "Asia/Phnom_Penh", KR: "Asia/Seoul", KW: "Asia/Kuwait",
  KZ: "Asia/Almaty", LB: "Asia/Beirut", LK: "Asia/Colombo", LT: "Europe/Vilnius", LU: "Europe/Luxembourg",
  LV: "Europe/Riga", LY: "Africa/Tripoli", MA: "Africa/Casablanca", MD: "Europe/Chisinau", MX: "America/Mexico_City",
  MY: "Asia/Kuala_Lumpur", NG: "Africa/Lagos", NL: "Europe/Amsterdam", NO: "Europe/Oslo", NP: "Asia/Kathmandu",
  NZ: "Pacific/Auckland", OM: "Asia/Muscat", PA: "America/Panama", PE: "America/Lima", PH: "Asia/Manila",
  PK: "Asia/Karachi", PL: "Europe/Warsaw", PT: "Europe/Lisbon", PY: "America/Asuncion", QA: "Asia/Qatar",
  RO: "Europe/Bucharest", RS: "Europe/Belgrade", RU: "Europe/Moscow", SA: "Asia/Riyadh", SE: "Europe/Stockholm",
  SG: "Asia/Singapore", SI: "Europe/Ljubljana", SK: "Europe/Bratislava", TH: "Asia/Bangkok", TN: "Africa/Tunis",
  TR: "Europe/Istanbul", TW: "Asia/Taipei", TZ: "Africa/Dar_es_Salaam", UA: "Europe/Kyiv", UG: "Africa/Kampala",
  US: "America/New_York", UY: "America/Montevideo", UZ: "Asia/Tashkent", VE: "America/Caracas", VN: "Asia/Ho_Chi_Minh",
  YE: "Asia/Aden", ZA: "Africa/Johannesburg", ZM: "Africa/Lusaka", ZW: "Africa/Harare",
};

// countries that span several time zones — local time is approximate ("primary")
export const MULTI_TZ = new Set(["US", "CA", "RU", "AU", "BR", "MX", "ID", "KZ", "CN", "CD", "AR", "CL"]);

// representative zones to show for the big multi-zone countries
export const MULTI_ZONES = {
  US: [["ET", "America/New_York"], ["CT", "America/Chicago"], ["MT", "America/Denver"], ["PT", "America/Los_Angeles"]],
  CA: [["ET", "America/Toronto"], ["CT", "America/Winnipeg"], ["MT", "America/Edmonton"], ["PT", "America/Vancouver"]],
  AU: [["AEST", "Australia/Sydney"], ["ACST", "Australia/Adelaide"], ["AWST", "Australia/Perth"]],
  RU: [["MSK", "Europe/Moscow"], ["YEKT", "Asia/Yekaterinburg"], ["KRAT", "Asia/Krasnoyarsk"], ["VLAT", "Asia/Vladivostok"]],
  BR: [["BRT", "America/Sao_Paulo"], ["AMT", "America/Manaus"]],
};

// a handful of common default regions for the picker (ISO 3166-1 alpha-2)
export const COMMON_REGIONS = ["IN", "US", "GB", "CA", "AU", "AE", "SG", "DE", "FR", "JP", "BR", "ZA"];
