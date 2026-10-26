export const incomeLabels = {
  under_100000: 'Below PHP 100,000',
  '100000_250000': 'PHP 100,000 - 250,000',
  '250000_500000': 'PHP 250,000 - 500,000',
  above_500000: 'Above PHP 500,000',
};

export function applicantAnswers(details) {
  if (!details) return [];
  return [
    ['Academic average', `${details.academic_average ?? ''} (${details.grading_scale === 'percentage' ? 'Percentage' : 'Grade point'})`],
    ['Year level', details.year_level],
    ['Annual household income', incomeLabels[details.income_range] || details.income_range],
    ['Household size', details.household_size],
    ['Motivation', details.motivation],
    ['Additional notes', details.additional_notes || 'None'],
  ];
}

