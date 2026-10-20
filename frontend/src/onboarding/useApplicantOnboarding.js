import { useContext } from 'react';
import { OnboardingContext } from './onboardingContext';

export default function useApplicantOnboarding() {
  return useContext(OnboardingContext);
}
