import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AuthLayout from './components/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { useUi } from '../../hooks/useUi';
import { HttpError } from '../../api/httpClient';

const SignupPage = () => {
  const { isAuthenticated, signup } = useAuth();
  const { pushToast } = useUi();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | undefined)?.from ?? '/complete-profile';

  if (isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !email || !password) {
      setFieldError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters long.');
      return;
    }

    setFieldError(null);
    setSubmitting(true);

    try {
      await signup({ username, email, password });
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.message || 'Unable to create account. Please try again.';
        setFieldError(message);
        pushToast({ type: 'error', title: message });
      } else {
        const message = 'Something went wrong while creating your account.';
        setFieldError(message);
        pushToast({ type: 'error', title: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your Sync account"
      subtitle="Join rooms, share queues, and watch YouTube together in real time."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      }
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

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-200" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-200" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;

