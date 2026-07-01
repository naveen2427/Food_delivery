import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';

export default function Auth({ onLoginSuccess, setPage }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { username, password } 
      : { username, email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        onLoginSuccess(data.user, data.token);
      } else {
        setSuccess('Registration successful! You can now log in.');
        setIsLogin(true);
        // Clean fields
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-card auth-card">
        <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p style={styles.subtitle}>
          {isLogin ? 'Sign in to access your gourmet dashboard' : 'Join FeastExpress and start ordering'}
        </p>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input 
                type="text" 
                className="form-input" 
                style={styles.inputWithIcon}
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={styles.inputWithIcon}
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input 
                type="password" 
                className="form-input" 
                style={styles.inputWithIcon}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Register As</label>
              <div style={styles.inputWrapper}>
                <ShieldCheck size={18} style={styles.inputIcon} />
                <select 
                  className="form-select" 
                  style={styles.inputWithIcon}
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="customer">Customer (Order Food)</option>
                  <option value="owner">Restaurant Owner (Manage Menu & Orders)</option>
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.toggleFooter}>
          <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <button 
            style={styles.toggleBtn} 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #fff 40%, var(--text-sub) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: 'var(--text-sub)',
    textAlign: 'center',
    fontSize: '0.9rem',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '48px',
    width: '100%',
  },
  submitBtn: {
    marginTop: '12px',
    padding: '14px',
  },
  errorAlert: {
    background: 'rgba(231, 29, 54, 0.1)',
    border: '1px solid rgba(231, 29, 54, 0.2)',
    color: 'var(--danger)',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    marginBottom: '20px',
    textAlign: 'center',
  },
  successAlert: {
    background: 'rgba(46, 196, 182, 0.1)',
    border: '1px solid rgba(46, 196, 182, 0.2)',
    color: 'var(--success)',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    marginBottom: '20px',
    textAlign: 'center',
  },
  toggleFooter: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '0 4px',
  },
};
