import { toast } from 'react-hot-toast';

export const extractErrorMessage = (error: any) => {
  const fieldErrors = error?.response?.data?.fields;
  if (fieldErrors && typeof fieldErrors === 'object') {
    return Object.values(fieldErrors).join('\n');
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong.'
  );
};

export const showErrorToast = (error: any, fallback?: string) => {
  const message = fallback || extractErrorMessage(error);
  toast.error(message);
  return message;
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};
