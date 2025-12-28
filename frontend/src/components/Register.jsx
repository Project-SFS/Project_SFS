import axios from "axios";
import React, { useState } from "react";
import {URL} from "../Utils";
import toast, {Toaster} from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "./PasswordStrength";
import Header from "./Header";

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
      <option value="evaluator">Evaluator</option>
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
    role: "",
    password: "",
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
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [email, setemail] = useState("")
  const [opt, setopt] = useState("")
  const [isPasswordValid, setIsPasswordValid] = useState(false);



  const handleVerifyOtp = () => {


    // const lodaing = toast.loading("Sending OTP")
    
    if (opt == form.otp) {
      setEmailVerified(true);
      setOtpSent(false);
      // toast.dismiss(lodaing)
      toast.success("verified successfully!")
      // alert("Email verified successfully!");
    } else {
      setErrors({ otp: "Invalid OTP. Please try again." });
    }
  }

  const handleemail = (e) => {
    e.preventDefault()
    
    setemail(e.target.value)

  }
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));

    if (name === "password") {
      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
      setIsPasswordValid(passwordRegex.test(value));
    }
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
          axios.post(`${URL}/verify_email/${email}`)
            .then(res => {
              if (res.status == 200) {
            
                toast.dismiss(lodaing)
                toast.success("OTP Sent")
                setGeneratedOtp(res.data), 
                setOtpSent(true);

              }
            });

        }
    

        setOtpSent(true);
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

    if (data.role === "spoc") {
      if (!data.name) fieldErrors.name = "SPOC Name is required";
      if (!data.college) fieldErrors.college = "College is required for SPOC";
      if (!data.collegeid)
        fieldErrors.collegeid = "College ID is required for SPOC";
    } else if (data.role === "evaluator") {
      if (!data.name) fieldErrors.name = "Evaluator Name is required";
      if (!data.college) fieldErrors.college = "Department is required for Evaluator";
      if (!data.collegeid) fieldErrors.collegeid = "ID is required for Evaluator";
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
           toast.success("Registered!", { style: { backgroundColor: "green" } });
           setTimeout(() => {
             navigate("/login");
           }, 2000);
         } else {
           toast.error("Error creating", { style: { backgroundColor: "red" } });
         }
      })



  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Header />
      <Toaster position="top-right" />
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden md:flex transition-all duration-500 ease-in-out">
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-orange-400 to-orange-600 items-center justify-center p-12 relative">
          <div className="absolute inset-0 bg-[#494949] bg-opacity-20"></div>
          <div className="text-white text-center relative z-10">
            <h2 className="text-4xl font-bold mb-4">Join Us</h2>
            <p className="text-lg opacity-90">Create your account to get started with SFS Portal</p>
            <div className="mt-8">
              <svg className="w-24 h-24 mx-auto text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-10">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Sign Up</h3>
            <p className="text-gray-600">Create your account to access the SFS Portal</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-6" aria-label="Register form">
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
                  className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
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
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 transform hover:scale-105"
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
                  className={`w-full px-4 py-3 border ${errors.otp ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
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
                  className="mt-3 w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 transform hover:scale-105"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {/* Remaining fields only after verification */}
            {emailVerified && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={onChange}
                    className={`w-full px-4 py-3 border ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
                    aria-invalid={!!errors.role}
                  >
                    <option value="">Select role</option>
                    <option value="spoc">SPOC</option>
                    <option value="evaluator">Evaluator</option>
                  </select>
                  {errors.role && (
                    <div className="mt-2 text-sm text-red-600" role="alert">
                      {errors.role}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <div className="mt-2 text-sm text-red-600" role="alert">
                      {errors.password}
                    </div>
                  )}
                  <PasswordStrength password={form.password} />
                </div>

                {(form.role === "spoc") && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">SPOC Name</label>
                      <input
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={onChange}
                        placeholder="Enter SPOC Name"
                        className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <div className="mt-2 text-sm text-red-600" role="alert">
                          {errors.name}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">College</label>
                      <input
                        name="college"
                        type="text"
                        value={form.college}
                        onChange={onChange}
                        placeholder="Enter College Name"
                        className={`w-full px-4 py-3 border ${errors.college ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
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
                        className={`w-full px-4 py-3 border ${errors.collegeid ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
                        aria-invalid={!!errors.collegeid}
                      />
                      {errors.collegeid && (
                        <div className="mt-2 text-sm text-red-600" role="alert">
                          {errors.collegeid}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {form.role === "evaluator" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Evaluator Name</label>
                      <input
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={onChange}
                        placeholder="Enter Evaluator Name"
                        className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <div className="mt-2 text-sm text-red-600" role="alert">
                          {errors.name}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                      <input
                        name="college"
                        type="text"
                        value={form.college}
                        onChange={onChange}
                        placeholder="Enter Department"
                        className={`w-full px-4 py-3 border ${errors.college ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
                        aria-invalid={!!errors.college}
                      />
                      {errors.college && (
                        <div className="mt-2 text-sm text-red-600" role="alert">
                          {errors.college}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ID</label>
                      <input
                        name="collegeid"
                        type="text"
                        value={form.collegeid}
                        onChange={onChange}
                        placeholder="Enter ID"
                        className={`w-full px-4 py-3 border ${errors.collegeid ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200`}
                        aria-invalid={!!errors.collegeid}
                      />
                      {errors.collegeid && (
                        <div className="mt-2 text-sm text-red-600" role="alert">
                          {errors.collegeid}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={!isPasswordValid}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 transform hover:scale-105"
                  >
                    Sign Up
                  </button>
                </div>
              </>
            )}
          </form>
          <div className="mt-8 text-center">
            <p className="text-gray-600">Already have an account? <a href="/login" className="text-orange-600 hover:text-orange-800 font-medium transition duration-200">Sign In</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
