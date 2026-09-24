import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Recycle, 
  Building2, 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../../types';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { register } = useAuth();
  
  // Step or Full Form
  const [role, setRole] = useState<UserRole>('seller');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Private Limited');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [docName, setDocName] = useState('');
  const [docDataUrl, setDocDataUrl] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; role: UserRole } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await register({
        fullName,
        email,
        password,
        confirmPassword,
        phone,
        companyName,
        businessType,
        registrationNumber,
        gstNumber,
        address,
        city,
        state,
        country,
        role,
        adminPasscode,
        documentName: docName,
        documentDataUrl: docDataUrl || 'base64-doc-placeholder',
      });

      setSuccessInfo({
        message: res.message,
        role: res.user.role
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (successInfo) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-md text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900">Registration Complete</h2>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed text-left">
            <span className="font-bold block mb-1">Status: Verification In Progress</span>
            {successInfo.message}
          </div>
          <p className="text-xs text-slate-500">
            You can now access your dashboard and prepare your catalog. Full buying/selling execution will unlock upon administrator verification approval.
          </p>
          <button
            id="reg-success-continue-btn"
            onClick={() => {
              if (successInfo.role === 'admin') navigate('/admin/dashboard');
              else if (successInfo.role === 'seller') navigate('/seller/dashboard');
              else navigate('/buyer/dashboard');
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Proceed to Corporate Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 items-center justify-center shadow-md mb-1">
          <Recycle className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Corporate Entity Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Join the verified B2B circular economy network. All corporate accounts undergo compliance vetting.
        </p>
      </div>

      {/* Main Form */}
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Role Choice */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Primary Business Operation Role *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                role === 'seller' ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-600' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={role === 'seller'}
                  onChange={() => setRole('seller')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-xs block">Seller / Supplier</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Have surplus raw materials, machinery, or inventory to monetize.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                role === 'buyer' ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-600' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked={role === 'buyer'}
                  onChange={() => setRole('buyer')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-xs block">Buyer / Manufacturer</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Seeking discounted surplus inputs for industrial production.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                role === 'admin' ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-600' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-xs block">Administrator</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Platform governance, document review, and ESG ledger auditing.
                  </span>
                </div>
              </label>
            </div>

            {/* Admin Passcode Entry */}
            {role === 'admin' && (
              <div className="mt-3 p-4 rounded-xl bg-purple-50/80 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Admin Security Authorization Required</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Administrator registration is restricted to authorized platform personnel. Please enter the master authorization key.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    Admin Security Passcode *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPasscode}
                    onChange={e => setAdminPasscode(e.target.value)}
                    placeholder="Enter admin authorization passcode..."
                    className="w-full text-xs rounded-xl border border-purple-300 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* User Contact Credentials */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Representative Officer Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name of Authorized Signatory *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Vikramaditya Sharma"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Phone / Mobile *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Business Details & Regulatory Numbers */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Corporate Entity & Tax Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Legal Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Industrial Solutions Pvt Ltd"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Entity Type *
                </label>
                <select
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Private Limited">Private Limited Company</option>
                  <option value="Public Limited">Public Limited Company</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration / CIN Number *
                </label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. U24100MH2021PTC123456"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GST Identification Number (GSTIN) *
                </label>
                <input
                  type="text"
                  required
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  placeholder="e.g. 27AAAAA1234A1Z5"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Headquarters / Warehouse Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Plot 45, MIDC Industrial Area, Phase II"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Verification Document Upload */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Government Regulatory Document Upload *
            </h3>
            <p className="text-xs text-slate-500">
              Upload Certificate of Incorporation, GST Registration Certificate, or Factory License for administrative clearance.
            </p>

            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-slate-400 transition-colors">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-9 w-9 text-slate-400" />
                <div className="flex text-xs text-slate-600 justify-center">
                  <label className="relative cursor-pointer rounded-md font-semibold text-emerald-600 hover:text-emerald-500">
                    <span>Select PDF or Document file</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">PDF, PNG, or JPG up to 10MB</p>
              </div>
            </div>

            {docName && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{docName}</span>
                <span className="ml-auto text-[11px] text-emerald-600 font-medium">Ready for compliance audit</span>
              </div>
            )}
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Submitting Registration Dossier...' : 'Complete Corporate Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-emerald-700 hover:text-emerald-800 underline"
            >
              Sign in to your account
            </button>
          </p>
        </div>
      </div>

    </div>
  );
};
