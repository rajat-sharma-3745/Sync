import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import AuthLayout from './components/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useUi } from '../../hooks/useUi';
import { userApi } from '../../api/userApi';
import { HttpError } from '../../api/httpClient';

const CompleteProfilePage = () => {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const { pushToast } = useUi();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username) {
      setFieldError('Username is required.');
      return;
    }

    setFieldError(null);
    setSubmitting(true);

    try {
      await userApi.updateProfile({ username });
      await refreshUser();
      pushToast({ type: 'success', title: 'Profile updated.' });
      navigate('/rooms', { replace: true });
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.message || 'Unable to update profile. Please try again.';
        setFieldError(message);
        pushToast({ type: 'error', title: message });
      } else {
        const message = 'Something went wrong while updating your profile.';
        setFieldError(message);
        pushToast({ type: 'error', title: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Complete your profile"
      subtitle="Add a few details so friends can recognize you in rooms."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-200" htmlFor="username">
            Username
          </label>
          <Input
            id="username"
            placeholder="syncfan"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        {fieldError ? (
          <p className="text-sm text-red-400" role="alert">
            {fieldError}
          </p>
        ) : null}

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={submitting}
          loading={submitting}
        >
          Save and continue
        </Button>
      </form>
    </AuthLayout>
  );
};

export default CompleteProfilePage;

