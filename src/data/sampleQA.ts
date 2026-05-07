import type { TranslationFile } from '@/types/translation';

export const SAMPLE_FILE: TranslationFile = {
  id: 'sample_01',
  name: 'onboarding_hi.xliff',
  sourceLanguage: 'en',
  targetLanguage: 'hi',
  units: [
    {
      id: 'u1',
      key: 'welcome_msg',
      source: 'Welcome to TransTech Hub!',
      target: 'TransTech Hub में आपका स्वागत है।',
      filePath: 'onboarding_hi.xliff',
      index: 1
    },
    {
      id: 'u2',
      key: 'login_btn',
      source: 'Sign in to your Account',
      target: 'अपने Account में साइन इन करें', // Issue: Terminology (Account should be खाता), Spelling (sign in)
      filePath: 'onboarding_hi.xliff',
      index: 2
    },
    {
      id: 'u3',
      key: 'error_msg',
      source: 'Error code: {0}',
      target: 'त्रुटि कोड: {1}', // Issue: Tag mismatch ({0} vs {1})
      filePath: 'onboarding_hi.xliff',
      index: 3
    },
    {
      id: 'u4',
      key: 'footer_text',
      source: 'All rights reserved.',
      target: 'सर्वाधिकार सुरक्षित', // Issue: Missing terminal punctuation
      filePath: 'onboarding_hi.xliff',
      index: 4
    },
    {
      id: 'u5',
      key: 'billing_info',
      source: 'Your balance is 500 USD.',
      target: 'आपका बैलेंस 5000 USD है।', // Issue: Number mismatch (500 vs 5000)
      filePath: 'onboarding_hi.xliff',
      index: 5
    },
    {
      id: 'u6',
      key: 'consistency_check',
      source: 'Click here',
      target: 'यहाँ क्लिक करें',
      filePath: 'onboarding_hi.xliff',
      index: 6
    },
    {
      id: 'u7',
      key: 'consistency_check_2',
      source: 'Click here',
      target: 'यहाँ दबाएं', // Issue: Inconsistency (Click here translated differently)
      filePath: 'onboarding_hi.xliff',
      index: 7
    }
  ]
};

export const SAMPLE_GLOSSARY = [
  { source: 'Account', target: 'खाता', context: 'User profile' },
  { source: 'Sign in', target: 'लॉग इन करें', context: 'Action' }
];
