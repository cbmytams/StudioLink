import test from 'node:test';
import assert from 'node:assert/strict';

import { useOnboardingStore } from './useOnboardingStore';

test('onboarding store supports four wizard steps', () => {
  useOnboardingStore.setState({
    currentStep: 1,
    onboardingComplete: false,
  });

  useOnboardingStore.getState().setCurrentStep(4);
  assert.equal(useOnboardingStore.getState().currentStep, 4);

  useOnboardingStore.getState().nextStep();
  assert.equal(useOnboardingStore.getState().currentStep, 4);
});
