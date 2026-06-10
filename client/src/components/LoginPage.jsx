import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Hash, GraduationCap, Shield, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [activeTab, setActiveTab] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [studentForm, setStudentForm] = useState({ prn: '', email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    const identifier = studentForm.email || studentForm.prn;
    if (!identifier) {
      toast.error('Please enter your PRN or email');
      return;
    }
    if (!studentForm.password) {
      toast.error('Please enter your password');
      return;
    }
    try {
      const res = await api.post('/auth/student/login', {
        email: identifier,
        password: studentForm.password
      });
      if (res.data.success) {
        toast.success('Login successful!');
        login(res.data.data.user, res.data.data.token);
        if (onLogin) onLogin('student');
        navigate('/student/dashboard');
      } else {
        toast.error(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminForm.email) {
      toast.error('Please enter your email');
      return;
    }
    if (!adminForm.password) {
      toast.error('Please enter your password');
      return;
    }
    try {
      const res = await api.post('/auth/coordinator/login', {
        email: adminForm.email,
        password: adminForm.password
      });
      if (res.data.success) {
        toast.success('Welcome, Coordinator!');
        login(res.data.data.user, res.data.data.token);
        if (onLogin) onLogin('admin');
        navigate('/admin/dashboard');
      } else {
        toast.error(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleForgotSubmit = () => {
    if (forgotStep === 'email') {
      if (!forgotEmail) { toast.error('Enter your email'); return; }
      toast.success('OTP sent to ' + forgotEmail);
      setForgotStep('otp');
    } else if (forgotStep === 'otp') {
      if (otp !== '123456') { toast.error('Invalid OTP. Use 123456 for demo.'); return; }
      setForgotStep('reset');
    } else {
      if (!newPassword) { toast.error('Enter a new password'); return; }
      toast.success('Password reset successfully!');
      setForgotOpen(false);
      setForgotStep('email');
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3d4f 0%, #568ea3 50%, #68c3d4 100%)' }}
      >
        {/* Decorative Circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full opacity-10" style={{ background: '#ffffff' }} />
        <div className="absolute bottom-[-100px] left-[-60px] w-[350px] h-[350px] rounded-full opacity-10" style={{ background: '#ffe8d1' }} />
        <div className="absolute top-1/2 right-[-40px] w-[200px] h-[200px] rounded-full opacity-5" style={{ background: '#ffffff' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="text-white text-2xl font-black">W</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl leading-tight">Walchand College</div>
              <div className="text-white/80 text-sm">of Engineering, Sangli</div>
            </div>
          </div>
          <div className="mt-6 w-12 h-1 rounded-full" style={{ background: '#ffe8d1' }} />
        </div>

        {/* Center Content */}
        <div className="relative z-10">
          <h1 className="text-white mb-4" style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 }}>
            Open Elective<br />Allocation System
          </h1>
          <p className="text-white/80 text-lg mb-10 max-w-md">
            A smart, automated platform for managing elective subject preferences and fair allocation for CSE undergraduate students.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {[
              { icon: '🎯', label: 'Smart Allocation', desc: 'Priority-based fair system' },
              { icon: '📊', label: 'Real-time Analytics', desc: 'Live capacity tracking' },
              { icon: '🔒', label: 'Secure & Reliable', desc: 'College-grade security' },
              { icon: '📱', label: 'Mobile Ready', desc: 'Responsive on all devices' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-white font-semibold text-sm">{f.label}</div>
                <div className="text-white/70 text-xs">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/60 text-sm">
          CSE Department · Academic Year 2024–25
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-6 bg-white min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #568ea3, #68c3d4)' }}>
                <span className="text-white font-black text-lg">W</span>
              </div>
              <div>
                <div className="font-bold text-gray-800">WCE Open Elective</div>
                <div className="text-xs text-gray-500">Allocation System · CSE Department</div>
              </div>
            </div>
            <div className="w-10 h-0.5 rounded-full" style={{ background: '#ffe8d1' }} />
          </div>

          <h2 className="text-gray-800 mb-1" style={{ fontWeight: 700 }}>Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to access your account</p>

          {/* Role Tabs */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: '#f1f5f9' }}>
            {['student', 'admin'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all duration-200"
                style={{
                  background: activeTab === tab ? '#568ea3' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : '#64748b',
                  fontWeight: activeTab === tab ? 600 : 400,
                  boxShadow: activeTab === tab ? '0 2px 8px rgba(86,142,163,0.3)' : 'none',
                }}
              >
                {tab === 'student' ? <GraduationCap size={15} /> : <Shield size={15} />}
                {tab === 'student' ? 'Student Login' : 'Coordinator'}
              </button>
            ))}
          </div>

          {/* Student Form */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">PRN Number</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. 1234567005"
                    value={studentForm.prn}
                    onChange={(e) => setStudentForm({ ...studentForm, prn: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none transition-all"
                    style={{ background: '#f8fafc' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#568ea3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(86,142,163,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">College Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="you@walchandsangli.ac.in"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none transition-all"
                    style={{ background: '#f8fafc' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#568ea3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(86,142,163,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none transition-all"
                    style={{ background: '#f8fafc' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#568ea3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(86,142,163,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setForgotOpen(true)} className="text-sm hover:underline" style={{ color: '#568ea3' }}>
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #568ea3, #68c3d4)', boxShadow: '0 4px 15px rgba(86,142,163,0.35)' }}
              >
                Sign In <ChevronRight size={16} />
              </button>

              <div className="rounded-xl p-4 text-sm" style={{ background: '#ffe8d1' }}>
                <div className="font-semibold mb-1.5" style={{ color: '#826251' }}>Demo Access</div>
                <div className="text-gray-600 text-xs space-y-0.5">
                  <div>Any PRN or email · Password: <span className="font-mono font-medium">any</span></div>
                  <div className="text-gray-500 mt-1">You will select your identity on the next screen.</div>
                </div>
              </div>
            </form>
          )}

          {/* Admin Form */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="coordinator@walchandsangli.ac.in"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none transition-all"
                    style={{ background: '#f8fafc' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#568ea3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(86,142,163,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none transition-all"
                    style={{ background: '#f8fafc' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#568ea3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(86,142,163,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #568ea3, #68c3d4)', boxShadow: '0 4px 15px rgba(86,142,163,0.35)' }}
              >
                Sign In as Coordinator <ChevronRight size={16} />
              </button>

              <div className="rounded-xl p-4 text-sm" style={{ background: '#ffe8d1' }}>
                <div className="font-semibold mb-1" style={{ color: '#826251' }}>Demo Credentials</div>
                <div className="text-gray-600">Email: <span className="font-mono font-medium">admin@wce.ac.in</span></div>
                <div className="text-gray-600">Password: <span className="font-mono font-medium">admin123</span></div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <button onClick={() => { setForgotOpen(false); setForgotStep('email'); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
              <ArrowLeft size={16} /> Back to login
            </button>

            {forgotStep === 'email' && (
              <>
                <h3 className="text-gray-800 mb-1" style={{ fontWeight: 600 }}>Reset Password</h3>
                <p className="text-gray-500 text-sm mb-6">Enter your college email to receive a one-time password.</p>
                <div className="relative mb-4">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" placeholder="you@walchandsangli.ac.in" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none" style={{ background: '#f8fafc' }} />
                </div>
              </>
            )}

            {forgotStep === 'otp' && (
              <>
                <h3 className="text-gray-800 mb-1" style={{ fontWeight: 600 }}>Enter OTP</h3>
                <p className="text-gray-500 text-sm mb-6">A 6-digit OTP has been sent to <strong>{forgotEmail}</strong>. (Demo OTP: <code>123456</code>)</p>
                <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none mb-4 text-center text-xl tracking-[0.5em] font-mono" style={{ background: '#f8fafc' }} />
              </>
            )}

            {forgotStep === 'reset' && (
              <>
                <h3 className="text-gray-800 mb-1" style={{ fontWeight: 600 }}>New Password</h3>
                <p className="text-gray-500 text-sm mb-6">Enter your new password.</p>
                <div className="relative mb-4">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none" style={{ background: '#f8fafc' }} />
                </div>
              </>
            )}

            <button onClick={handleForgotSubmit}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #568ea3, #68c3d4)' }}>
              {forgotStep === 'email' ? 'Send OTP' : forgotStep === 'otp' ? 'Verify OTP' : 'Reset Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}