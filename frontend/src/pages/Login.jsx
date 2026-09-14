import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Shield, Sparkles, User, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickUsers, setQuickUsers] = useState([]);

  const { user, token, loading: authLoading, login, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to user's specific dashboard
  useEffect(() => {
    if (!authLoading && user && (token || localStorage.getItem('zentra_token'))) {
      const target = getDashboardPath ? getDashboardPath(user) : (user.role_name === 'admin' ? '/admin' : (user.user_type === 'client' ? '/client' : '/employee'));
      navigate(target, { replace: true });
    }
  }, [user, token, authLoading, navigate, getDashboardPath]);

  useEffect(() => {
    // Fetch test users for quick login switch
    api.get('/auth/quick-users')
      .then(res => setQuickUsers(res || []))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      const target = getDashboardPath ? getDashboardPath(data.user) : (data.user.role_name === 'admin' ? '/admin' : (data.user.user_type === 'client' ? '/client' : '/employee'));
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (u, autoLogin = false) => {
    const pwd = 'Admin@123';
    setUsername(u.username);
    setPassword(pwd);
    if (autoLogin) {
      setError('');
      setLoading(true);
      try {
        const data = await login(u.username, pwd);
        const target = getDashboardPath ? getDashboardPath(data.user) : (data.user.role_name === 'admin' ? '/admin' : (data.user.user_type === 'client' ? '/client' : '/employee'));
        navigate(target, { replace: true });
      } catch (err) {
        setError(err.message || 'Failed to authenticate quick user.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070A13',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid #1F2937',
        borderRadius: '20px',
        padding: '36px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
          }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Zentra Digital ERP
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Unified Agency Operations & Client Collaboration Platform
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#F87171',
            fontSize: '13px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#D1D5DB', marginBottom: '6px' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6B7280' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin or user@zentra.com"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 40px',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '10px',
                  color: '#F9FAFB',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#D1D5DB', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6B7280' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 40px',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '10px',
                  color: '#F9FAFB',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In to Platform <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Persona Switcher for Evaluation */}
        {quickUsers.length > 0 && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Sparkles size={14} color="#60A5FA" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quick Persona Login (Testing)
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {quickUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u, true)}
                  title={`Click to instantly sign in as ${u.role_display || u.role_name}`}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: username === u.username ? '1px solid #3B82F6' : '1px solid #374151',
                    background: username === u.username ? 'rgba(59, 130, 246, 0.2)' : '#1F2937',
                    color: username === u.username ? '#60A5FA' : '#E5E7EB',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{u.role_display || u.role_name}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>({u.username})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <a
            href="/"
            style={{ fontSize: '12.5px', color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#9CA3AF'}
            onMouseLeave={e => e.target.style.color = '#6B7280'}
          >
            ← Return to Zentra Digital Marketing Website
          </a>
        </div>
      </div>
    </div>
  );
}
