import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AuthLayout from './components/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { useUi } from '../../hooks/useUi';
import { HttpError } from '../../api/httpClient';

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const { pushToast } = useUi();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | undefined)?.from ?? '/rooms';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setFieldError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters long.');
      return;
    }

    setFieldError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.message || 'Unable to sign in. Please check your credentials.';
        setFieldError(message);
        pushToast({ type: 'error', title: message });
      } else {
        const message = 'Something went wrong while signing in.';
        setFieldError(message);
        pushToast({ type: 'error', title: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue watching in sync."
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
            Create one
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {fieldError ? (
          <p className="text-sm text-red-400" role="alert">
            {fieldError}
          </p>
        ) : null}

        <Button type="submit" className="mt-2 w-full" disabled={submitting} loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;

