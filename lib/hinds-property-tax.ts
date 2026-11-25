// Facts for /hinds-county-property-tax. Office details are from Hinds
// County's own pages, the rules from the Mississippi Code and the Department
// of Revenue. When an office or a law changes, change it here and move
// `checked` forward. Dates are worked out from the calendar below, so the page
// never shows a past deadline as the next one.

const COUNTY = "https://www.hindscountyms.com";
// The county's older database site. Its own pages link to it over http.
const COUNTY_DB = "http://www.co.hinds.ms.us/pgs";
const BILLS = "https://billstatus.ls.state.ms.us/documents";

export const TAX = {
  // The day these facts were last compared with the sources.
  checked: "2026-11-25",
  hours: "8 a.m. to 5 p.m. Monday through Friday, except legal holidays",
  collector: {
    name: "Eddie J. Fair",
    jackson: {
      address: "316 S. President St., Jackson, MS 39201",
      mail: "P.O. Box 1727, Jackson, MS 39215-1727",
      phones: ["601-968-6587", "601-968-6588", "601-968-6590"],
    },
    raymond: {
      address: "127 W. Main St., Raymond, MS 39154",
      mail: "P.O. Box 51, Raymond, MS 39154",
      phone: "601-857-5574",
    },
    // The number the office's FAQ gives for a tax bill that did not arrive.
    billPhone: "601-968-6591",
  },
  assessor: {
    name: "Charles E. Stokes",
    jackson: {
      address: "316 S. President St., Jackson, MS 39201",
      mail: "P.O. Box 22908, Jackson, MS 39225-2908",
      phone: "601-968-6616",
    },
    raymond: { mail: "P.O. Box 549, Raymond, MS 39154", phone: "601-857-8787" },
    // From the office's instruction sheet for looking up a value online.
    valuePhones: ["601-968-6619", "601-968-6622"],
  },
  chancery: {
    name: "Eddie Jean Carr",
    jackson: {
      address: "316 S. President St., Jackson, MS 39201",
      mail: "P.O. Box 686, Jackson, MS 39205-0686",
      phone: "601-968-6508",
    },
    raymond: {
      address: "Main Street, Annex Building, Raymond, MS 39154",
      mail: "P.O. Box 88, Raymond, MS 39154",
      phone: "601-857-8055",
    },
  },
  // The tax districts the county's online estimator lists.
  estimatorDistricts: [
    "Bolton",
    "Byram",
    "Clinton",
    "Clinton Separate School District",
    "County",
    "Edwards",
    "Hinds-Rankin Flood District",
    "Jackson",
    "Jackson Annex",
    "Jackson Separate School District",
    "Learned",
    "Raymond",
    "Terry",
    "Terry Annex",
    "Utica",
  ],
  sources: {
    collector: `${COUNTY}/elected-offices/tax-collector`,
    assessor: `${COUNTY}/elected-offices/tax-assessor`,
    chancery: `${COUNTY}/elected-offices/chancery-clerk`,
    payOnline: `${COUNTY}/pay-online`,
    taxSaleFlyer: `${COUNTY}/sites/default/files/tax-sale-faq.pdf`,
    homesteadWorksheet: `${COUNTY}/sites/default/files/Homestead_Worksheet.pdf`,
    tenPercentForm: `${COUNTY}/sites/default/files/TaxAssessor10Percent.pdf`,
    valueLookupSheet: `${COUNTY}/sites/default/files/InquiryInstuctionSheet.pdf`,
    collectorFaq: `${COUNTY_DB}/faq.asp?id=Tax%20Collector`,
    payLookup: `${COUNTY_DB}/apps/real_property_billing_roll_query.asp`,
    redemptionLookup: `${COUNTY_DB}/apps/tax_sale_query.asp`,
    taxSaleFiles: `${COUNTY_DB}/taxsalefiles.asp`,
    estimator: `${COUNTY_DB}/elected/ta_estimated_taxes.asp`,
    landRoll: `${COUNTY_DB}/apps/landroll_query.asp`,
    phoneDirectory: `${COUNTY_DB}/apps/phonebook/phonebook.asp`,
    dorFaq: "https://www.dor.ms.gov/county-services/property-tax-frequently-asked-questions",
    dorHomestead: "https://www.dor.ms.gov/county-services/homestead-exemption",
    dorLaws2026: "https://www.dor.ms.gov/forms-resources/laws-regulations/2026-legislation",
    // The official code as released July 8, 2020, republished by
    // Public.Resource.Org. Title 27 is one very large page, so readers are
    // sent to the index.
    code2020: "https://unicourt.github.io/cic-code-ms/",
    // The Legislature's index of bills by the code section they touch.
    billLookup: "https://billstatus.ls.state.ms.us/2026/pdf/lookup.htm",
    hb859of2020: `${BILLS}/2020/html/HB/0800-0899/HB0859SG.htm`,
    hb420of2026: `${BILLS}/2026/html/HB/0400-0499/HB0420SG.htm`,
    hb4044of2026: `${BILLS}/2026/html/HB/4000-4099/HB4044SG.htm`,
    sb2882of2026: `${BILLS}/2026/html/SB/2800-2899/SB2882SG.htm`,
  },
} as const;

export type TaxDateKind = "taxes-due" | "homestead" | "installment-2" | "installment-3" | "tax-sale";

export interface TaxDate {
  kind: TaxDateKind;
  label: string;
  date: string; // yyyy-mm-dd, the calendar date the law names
  // True when that calendar date is a Saturday or Sunday. The page then
  // quotes what the law says about weekends instead of working out a new day.
  weekend: boolean;
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Day of the week (0 = Sunday) for a yyyy-mm-dd calendar date.
function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// The last Monday in August, the day Section 27-41-59 sets for the tax sale.
export function lastMondayOfAugust(year: number): string {
  const lastDay = new Date(Date.UTC(year, 7, 31)).getUTCDay();
  return iso(year, 8, 31 - ((lastDay + 6) % 7));
}

// The dates state law sets for one calendar year.
function datesIn(year: number): TaxDate[] {
  const list: Omit<TaxDate, "weekend">[] = [
    {
      kind: "taxes-due",
      label: `Taxes on property assessed in ${year - 1} are due`,
      date: iso(year, 2, 1),
    },
    { kind: "homestead", label: "Last day to apply for homestead exemption", date: iso(year, 4, 1) },
    {
      kind: "installment-2",
      label: "Second installment due, where installments are allowed",
      date: iso(year, 5, 1),
    },
    {
      kind: "installment-3",
      label: "Final installment due, where installments are allowed",
      date: iso(year, 7, 1),
    },
    { kind: "tax-sale", label: "Tax sale, the last Monday in August", date: lastMondayOfAugust(year) },
  ];
  return list.map((d) => ({ ...d, weekend: [0, 6].includes(weekday(d.date)) }));
}

// The next `count` dates on or after `today` (yyyy-mm-dd), soonest first.
export function upcomingTaxDates(today: string, count = 5): TaxDate[] {
  const year = Number(today.slice(0, 4));
  return [...datesIn(year), ...datesIn(year + 1)].filter((d) => d.date >= today).slice(0, count);
}

// The homestead filing period that is open now or comes next: Jan. 1 through
// April 1.
export function homesteadWindow(today: string): { opens: string; closes: string; open: boolean } {
  const year = Number(today.slice(0, 4));
  const y = today <= iso(year, 4, 1) ? year : year + 1;
  const opens = iso(y, 1, 1);
  return { opens, closes: iso(y, 4, 1), open: today >= opens };
}
