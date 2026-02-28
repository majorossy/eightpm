'use client';

import React, { useState, useCallback, FormEvent } from 'react';
import { useToast } from '@/hooks/useToast';
import { useContactSubmissions } from '@/hooks/useContactSubmissions';
import { SendIcon } from '@/components/icons/FooterIcons';
import { VALIDATION_LIMITS } from '@/lib/validation';

// Subject options for the dropdown
const SUBJECT_OPTIONS = [
  { value: '', label: 'Select a topic...' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feedback', label: 'Feedback & Suggestions' },
  { value: 'metadata', label: 'Missing/Incorrect Metadata' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'other', label: 'Other' },
];

// Form field validation
interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { addSubmission } = useContactSubmissions();

  // Validate a single field
  const validateField = useCallback((name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < VALIDATION_LIMITS.NAME_MIN) return `Name must be at least ${VALIDATION_LIMITS.NAME_MIN} characters`;
        if (value.length > VALIDATION_LIMITS.NAME_MAX) return `Name must be less than ${VALIDATION_LIMITS.NAME_MAX} characters`;
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (value.length > VALIDATION_LIMITS.EMAIL_MAX) return 'Email address too long';
        if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
        return undefined;
      case 'subject':
        if (!value) return 'Please select a topic';
        return undefined;
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < VALIDATION_LIMITS.MESSAGE_MIN) return `Message must be at least ${VALIDATION_LIMITS.MESSAGE_MIN} characters`;
        if (value.length > VALIDATION_LIMITS.MESSAGE_MAX) return `Message must be less than ${VALIDATION_LIMITS.MESSAGE_MAX} characters`;
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // Validate all fields
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    return newErrors;
  }, [formData, validateField]);

  // Handle field change
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  // Handle field blur (for validation feedback)
  const handleBlur = useCallback((
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate this field
    const error = validateField(name as keyof FormData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true,
    });

    // Validate all fields
    const formErrors = validateForm();
    setErrors(formErrors);

    // If there are errors, don't submit
    if (Object.keys(formErrors).length > 0) {
      showError('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save to localStorage
      addSubmission({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      });

      // Reset form
      setFormData(initialFormData);
      setTouched({});
      setErrors({});

      showSuccess('Thank you! Your message has been sent.');
    } catch {
      showError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, addSubmission, showSuccess, showError]);

  // Field input classes
  const getInputClassName = (fieldName: keyof FormData) => {
    const hasError = touched[fieldName] && errors[fieldName];
    return `w-full px-4 py-3 bg-surface-base border rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
      hasError ? 'border-red-500/50' : 'border-default'
    }`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-accent mb-2">
          Your Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="John Doe"
          maxLength={VALIDATION_LIMITS.NAME_MAX}
          className={getInputClassName('name')}
          aria-invalid={touched.name && !!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {touched.name && errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-accent mb-2">
          Email Address <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="john@example.com"
          maxLength={VALIDATION_LIMITS.EMAIL_MAX}
          className={getInputClassName('email')}
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {touched.email && errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Subject dropdown */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-accent mb-2">
          Topic <span className="text-red-400">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          onBlur={handleBlur}
          className={getInputClassName('subject')}
          aria-invalid={touched.subject && !!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
        >
          {SUBJECT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {touched.subject && errors.subject && (
          <p id="subject-error" className="mt-1 text-sm text-red-400" role="alert">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message textarea */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-accent mb-2">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Tell us what's on your mind..."
          rows={5}
          maxLength={VALIDATION_LIMITS.MESSAGE_MAX}
          className={`${getInputClassName('message')} resize-none`}
          aria-invalid={touched.message && !!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {touched.message && errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-400" role="alert">
            {errors.message}
          </p>
        )}
        <p className="mt-1 text-xs text-tertiary">
          {formData.message.length} / {VALIDATION_LIMITS.MESSAGE_MAX} characters
        </p>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-inverse font-semibold rounded hover:bg-accent-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sending...
          </>
        ) : (
          <>
            <SendIcon className="w-5 h-5" />
            Send Message
          </>
        )}
      </button>

      <p className="text-xs text-tertiary text-center">
        Your message is stored locally on this device. We value your privacy.
      </p>
    </form>
  );
}

export default ContactForm;
