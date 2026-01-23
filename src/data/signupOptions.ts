export const industryOptions = [
  { value: 'landscaping', label: 'Landscaping & Design' },
  { value: 'excavation', label: 'Civil & Excavation' },
  { value: 'paving', label: 'Paving & Asphalt' },
  { value: 'utility', label: 'Utility & Underground' },
  { value: 'demolition', label: 'Demolition & Forestry' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'other', label: 'Other' },
] as const;

export const fieldEmployeesOptions = [
  { value: '1-5', label: '1-5' },
  { value: '6-15', label: '6-15' },
  { value: '16-30', label: '16-30' },
  { value: '31-50', label: '31-50' },
  { value: '51-100', label: '51-100' },
  { value: '100+', label: '100+' },
] as const;

export const annualRevenueOptions = [
  { value: 'under_500k', label: 'Under $500K' },
  { value: '500k_1m', label: '$500K - $1M' },
  { value: '1m_3m', label: '$1M - $3M' },
  { value: '3m_6m', label: '$3M - $6M' },
  { value: '6m_10m', label: '$6M - $10M' },
  { value: '10m_20m', label: '$10M - $20M' },
  { value: '20m_plus', label: '$20M+' },
] as const;

export const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;

export const canadianProvinces = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
] as const;

export const regionOptions = [
  { group: 'United States', options: usStates },
  { group: 'Canada', options: canadianProvinces },
] as const;

// Helper to get label from value
export function getIndustryLabel(value: string): string {
  return industryOptions.find(o => o.value === value)?.label || value;
}

export function getFieldEmployeesLabel(value: string): string {
  return fieldEmployeesOptions.find(o => o.value === value)?.label || value;
}

export function getAnnualRevenueLabel(value: string): string {
  return annualRevenueOptions.find(o => o.value === value)?.label || value;
}

export function getRegionLabel(value: string): string {
  const allRegions = [...usStates, ...canadianProvinces];
  return allRegions.find(o => o.value === value)?.label || value;
}

export const referralSourceOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X.com' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'ai', label: 'AI' },
  { value: 'google', label: 'Google' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'friends', label: 'Friends' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: 'Other' },
] as const;

export function getReferralSourceLabel(value: string): string {
  return referralSourceOptions.find(o => o.value === value)?.label || value;
}
