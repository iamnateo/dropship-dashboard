import React, { useState, useEffect } from 'react';
import { cjAPI, authAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Settings = () => {
  const [cjConnected, setCjConnected] = useState(false);
  const [cjBalance, setCjBalance] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    checkCjStatus();
  }, []);

  const checkCjStatus = async () => {
    try {
      const res = await cjAPI.getStatus();
      setCjConnected(res.data.connected);
      if (res.data.connected && res.data.balance) {
        setCjBalance(res.data.balance);
      }
    } catch (error) {
      console.error('Failed to check CJ status');
    } finally {
      setLoading(false);
    }
  };

  const connectCj = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Please enter your CJ API key');
      return;
    }

    setConnecting(true);
    try {
      await cjAPI.connect(apiKey);
      toast.success('CJ account connected successfully!');
      setCjConnected(true);
      setApiKey('');
      checkCjStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to connect CJ account');
    } finally {
      setConnecting(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* CJ DropShipping Integration */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>CJDropShipping Integration</h2>
        
        {cjConnected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#d1fae5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <div>
                <h3 style={{ fontWeight: 600, color: '#065f46' }}>Connected</h3>
                <p style={{ fontSize: '0.875rem', color: '#047857' }}>Your CJ account is connected and ready to use</p>
              </div>
            </div>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => { setCjConnected(false); setApiKey(''); }}
              style={{ marginBottom: '1rem' }}
            >
              🔄 Reconnect / Update API Key
            </button>
            
            {cjBalance && (
              <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Account Balance</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                  ${cjBalance.balance || '0.00'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>⚠️ Not Connected</h4>
              <p style={{ fontSize: '0.875rem', color: '#b45309' }}>
                Connect your CJDropShipping account to import products and manage orders.
              </p>
            </div>
            
            <form onSubmit={connectCj}>
              <div className="form-group">
                <label className="form-label">CJ API Key</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="form-input"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your CJ API key"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? '👁️ Hide' : '👁️ Show'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Get your API key from: CJ Dashboard → Developer → API
                </p>
              </div>
              <button type="submit" className="btn btn-primary" disabled={connecting}>
                {connecting ? 'Connecting...' : 'Connect CJ Account'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>Account Settings</h2>
        
        <form onSubmit={changePassword}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Change Password</h3>
          
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={changingPassword}>
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Integration Instructions */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>How to Get CJ API Key</h2>
        
        <div style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>Log in to your CJDropShipping account at <strong>cjdropshipping.com</strong></li>
            <li>Go to <strong>"Developer"</strong> in the left sidebar</li>
            <li>Click on <strong>"API"</strong></li>
            <li>Click <strong>"Generate API Key"</strong> button</li>
            <li>Copy the API key and paste it above</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Settings;
