import axios from "axios";
import AuthLayout from "./AuthLayout";
import React, { useState, useEffect } from "react";
import {URL} from "../Utils";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import PasswordFields, { passwordsReady, passwordIsValid } from "./PasswordFields";

const RoleSelect = ({ value, onChange, error }) => (
  <div className="mb-4">
    <select
      name="role"
      value={value}
      onChange={onChange}
      className={`w-full p-3 border ${error ? 'border-red-500' : 'border-gray-200'} rounded focus:outline-none focus:ring-2 focus:ring-[#fc8f00] text-[#4a4a4a]`}
      aria-invalid={!!error}
    >
      <option value="">Select role</option>
      <option value="spoc">SPOC</option>
    </select>
    {error && (
      <div className="mt-2 text-sm text-[#fc8f00]" role="alert">
        {error}
      </div>
    )}
  </div>
);

const Register = () => {
  const [form, setForm] = useState({
    otp:"",
    role: "spoc", // only SPOCs register themselves; admins create the other accounts
    password: "",
    confirmPassword: "",
    college: "",
    collegeid: "",
    dept: "",
    id: "",
    name: "",
    date: new Date().toString().split(" ").slice(1, 4).join(" ")
  });
  const navigate = useNavigate()
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [email, setemail] = useState("")
  // seconds until "Resend OTP" is allowed again (the server accepts one OTP per email every 30s)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);
  // password and its re-entry must follow the rule and match before sign-up is possible
  const isPasswordValid = passwordsReady(form.password, form.confirmPassword);
  const setPasswordField = (name) => (value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, password: undefined }));
  };



  // the server checks the code; the browser never sees the real OTP
  const handleVerifyOtp = () => {
    axios.post(`${URL}/verify_otp`, { email, otp: form.otp })
      .then(() => {
        setEmailVerified(true);
        setOtpSent(false);
        toast.success("verified successfully!")
      })
      .catch((err) => {
        setErrors({ otp: err.response?.data?.message || "Invalid OTP. Please try again." });
      });
  }

  const handleemail = (e) => {
    e.preventDefault()
    setemail(e.target.value)
    // a different email needs its own OTP: go back to the "Verify Email" step
    if (otpSent) {
      setOtpSent(false);
      setResendIn(0);
      setForm((prev) => ({ ...prev, otp: "" }));
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }

  }
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));

  };

  const checkIfEmailAlreadyExist = async (email) => {
    
    const data = await axios.post(`${URL}/checkifemailexist`, { email })
    .then(res=>(res.data)
    )

    return data
    
    
   
  }

  // ✅ Simulate sending OTP
  const handleSendOtp = async() => {
    
    if (await checkIfEmailAlreadyExist(email)) {
    
      if (email.trim().includes("@")) {
      
        const lodaing = toast.loading("Sending OTP")

        if (email) {
          axios.post(`${URL}/verify_email/${encodeURIComponent(email.trim())}`)
            .then(() => {
              toast.dismiss(lodaing)
              toast.success("OTP Sent")
              setOtpSent(true);
              setResendIn(30);
            })
            .catch((err) => {
              toast.dismiss(lodaing)
              toast.error(err.response?.data?.message || "Could not send OTP")
            });

        }
        // alert(`OTP sent to ${email}`); // For demo only
      }
      else {
        toast.error("Enter valid email")
      }
    }
    else {
      toast.error("Email already exist")
    }
  // ✅ Verify OTP entered by user
  
   
  };

  const validate = (data) => {
    const fieldErrors = {};
    if (!data.emailVerified && !emailVerified)
      fieldErrors.email = "Email must be verified first";
    if (!data.role) fieldErrors.role = "Role is required";
    if (!data.password) fieldErrors.password = "Password is required";
    else if (!passwordIsValid(data.password)) fieldErrors.password = "The password does not meet the rules";
    else if (data.password !== data.confirmPassword) fieldErrors.password = "The passwords do not match";

    if (data.role === "spoc") {
      if (!data.name) fieldErrors.name = "SPOC Name is required";
      if (!data.college) fieldErrors.college = "College is required for SPOC";
      if (!data.collegeid)
        fieldErrors.collegeid = "College ID is required for SPOC";
    }

    return fieldErrors;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    
    }
       axios.post(`${URL}/register`, {
        email,
        password: form.password,
        role: form.role,
        college: form.college,
        college_code: form.collegeid,
        name: form.name,
        date: form.date
       }).then((res) => {
        
         if (res.status === 200) {
           toast.success("Registered! An admin will approve your account.", { style: { backgroundColor: "green" } });
           setTimeout(() => {
             navigate("/login");
           }, 2000);
         } else {
           toast.error("Error creating", { style: { backgroundColor: "red" } });
         }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Error creating", { style: { backgroundColor: "red" } });
      })



  };

  return (
    <AuthLayout
      title="Create your SPOC account"
      subtitle="For college coordinators. Verify your email, then add your details; an admin approves new SPOC accounts."
    >
      {/* two steps: verify the email address, then the account details */}
      <ol className="flex items-center gap-3 mb-6 text-sm">
        {[["1", "Verify email", true], ["2", "Your details", emailVerified]].map(([n, label, active], i) => (
          <li key={n} className="flex items-center gap-3">
            {i > 0 && <span className={`h-px w-8 ${active ? "bg-[#fc9300]" : "bg-gray-200"}`} />}
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-[#fc9300] text-white" : "bg-gray-100 text-gray-500"}`}>
              {i === 0 && emailVerified ? "✓" : n}
            </span>
            <span className={active ? "font-semibold text-gray-900" : "text-gray-500"}>{label}</span>
          </li>
        ))}
      </ol>
      <form onSubmit={onSubmit} className="space-y-5" aria-label="Register form">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              type="email"
              value={email}
              onChange={handleemail}
              required
              placeholder="Enter Your Email"
              disabled={emailVerified}
              className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition`}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && (
            <div className="mt-2 text-sm text-red-600" role="alert">
              {errors.email}
            </div>
          )}
        </div>

        {/* Verify Email Button */}
        {!otpSent && !emailVerified && (
          <div>
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full bg-[#fc9300] text-white py-3 rounded-xl font-semibold hover:bg-[#e68400] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 transition"
            >
              Verify Email
            </button>
          </div>
        )}

        {/* OTP Field */}
        {otpSent && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">OTP</label>
            <input
              name="otp"
              type="text"
              value={form.otp}
              onChange={onChange}
              placeholder="Enter OTP"
              className={`w-full px-4 py-3 border ${errors.otp ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition`}
              aria-invalid={!!errors.otp}
            />
            {errors.otp && (
              <div className="mt-2 text-sm text-red-600" role="alert">
                {errors.otp}
              </div>
            )}
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="mt-3 w-full bg-[#fc9300] text-white py-3 rounded-xl font-semibold hover:bg-[#e68400] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 transition"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={resendIn > 0}
              className="mt-2 w-full text-sm font-semibold text-orange-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Didn't get it? Resend OTP"}
            </button>
            <p className="mt-1 text-xs text-gray-500 text-center">
              Check your Spam folder too. To use a different email, just change it above.
            </p>
          </div>
        )}

        {/* Remaining fields only after verification */}
        {emailVerified && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                SPOC (college coordinator)
              </div>
              {errors.role && (
                <div className="mt-2 text-sm text-red-600" role="alert">
                  {errors.role}
                </div>
              )}
            </div>

            <div>
              <PasswordFields
                password={form.password}
                confirm={form.confirmPassword}
                onPasswordChange={setPasswordField("password")}
                onConfirmChange={setPasswordField("confirmPassword")}
                inputClassName={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition`}
              />
              {errors.password && (
                <div className="mt-2 text-sm text-red-600" role="alert">
                  {errors.password}
                </div>
              )}
            </div>

            {(form.role === "spoc") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SPOC Name</label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Enter SPOC Name"
                    className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition`}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <div className="mt-2 text-sm text-red-600" role="alert">
                      {errors.name}
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2 sm:order-last">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">College</label>
                  <input
                    name="college"
                    type="text"
                    value={form.college}
                    onChange={onChange}
                    placeholder="Enter College Name"
                    className={`w-full px-4 py-3 border ${errors.college ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition`}
                    aria-invalid={!!errors.college}
                  />
                  {errors.college && (
                    <div className="mt-2 text-sm text-red-600" role="alert">
                      {errors.college}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">College ID</label>
                  <input
                    name="collegeid"
                    type="text"
                    value={form.collegeid}
                    onChange={onChange}
                    placeholder="Enter College ID"
                    className={`w-full px-4 py-3 border ${errors.collegeid ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition`}
                    aria-invalid={!!errors.collegeid}
                  />
                  {errors.collegeid && (
                    <div className="mt-2 text-sm text-red-600" role="alert">
                      {errors.collegeid}
                    </div>
                  )}
                </div>
              </div>
            )}


            <div>
              <button
                type="submit"
                disabled={!isPasswordValid}
                className="w-full bg-[#fc9300] text-white py-3 rounded-xl font-semibold hover:bg-[#e68400] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign Up
              </button>
            </div>
          </>
        )}
      </form>
      <p className="mt-6 text-center text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-[#fc9300] hover:text-[#c76f00] font-semibold">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
