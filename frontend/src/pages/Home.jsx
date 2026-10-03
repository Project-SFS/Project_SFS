/**
 * @file Home.jsx
 * @description The main landing page of the application, accessible to all users.
 */
import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import WaveImage from "../components/WaveImage";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaUsers,
  FaLightbulb,
  FaTrophy,
  FaArrowRight,
  FaQuoteLeft,
  FaStar,
  FaCheckCircle,
  FaRocket,
  FaGlobe,
  FaAward,
  FaChevronRight,
  FaUniversity,
  FaIndustry,
  FaChalkboardTeacher,
  FaHandshake,
  FaSearch,
  FaHandPointer,
  FaTools,
  FaChartLine,
  FaUserTie,
} from "react-icons/fa";
import FAQ from "./FAQ";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { URL } from "../Utils";

const ABOUT_POINTS = [
  { title: "Live Industry Challenges", text: "Work on real, current problems drawn directly from industrial operations.", icon: FaIndustry },
  { title: "Mentorship from Industry Experts", text: "Gain practical guidance, insights, and feedback from experienced professionals.", icon: FaChalkboardTeacher },
  { title: "Industry-Academia Collaboration", text: "Bring together academic talent and industrial expertise to create meaningful solutions.", icon: FaHandshake },
  { title: "Ideas into Impact", text: "Transform promising ideas into practical solutions with measurable value.", icon: FaRocket },
];

const KEY_FEATURES = [
  { title: "Real-Time Industrial Challenges", text: "Challenges come straight from Sakthi Auto's shop floors and operations, so every solution addresses a real need.", icon: FaLightbulb },
  { title: "Guidance from Industry Experts", text: "Experienced professionals review your work and share feedback that sharpens your solution.", icon: FaUserTie },
  { title: "Collaborative Industry Partnerships", text: "Colleges, faculty and Sakthi Auto work together to turn academic ideas into industrial results.", icon: FaHandshake },
];

const HOW_IT_WORKS = [
  { title: "Discover", text: "Explore real-time industrial challenges from Sakthi Auto.", icon: FaSearch },
  { title: "Select", text: "Choose a challenge aligned with your interests and capabilities.", icon: FaHandPointer },
  { title: "Solve", text: "Develop a practical solution with your team.", icon: FaTools },
  { title: "Present & Implement", text: "Showcase the solution and take promising ideas toward validation or implementation.", icon: FaChartLine },
  { title: "Mentor & Refine", text: "Strengthen the solution through guidance from industry experts.", icon: FaChalkboardTeacher },
];

const Homepage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState(null);

  // live hero numbers; on failure the cards show 0 rather than a made-up figure
  useEffect(() => {
    let alive = true;
    axios.get(`${URL}/public/stats`)
      .then((res) => alive && setStats(res.data))
      .catch(() => alive && setStats({ students: 0, problems: 0, colleges: 0 }));
    return () => { alive = false; };
  }, []);

  const slides = [
    {
      img: "/src/assets/kriya.png",
      title: "Solve for Sakthi",
      subtitle: "Empowering innovation through collaborative problem-solving",
      description:
        "Join teams, tackle real-world challenges, and drive change in manufacturing and beyond.",
      ctaText: "Get Started",
      ctaLink: "/register",
    },
    {
      img: "/src/assets/kriya.png",
      title: "Innovate Together",
      subtitle: "Connect with like-minded students and industry experts",
      description:
        "Form teams, collaborate on cutting-edge problems, and bring your ideas to life.",
      ctaText: "Explore Problems",
      ctaLink: "/student",
    },
    {
      img: "/src/assets/kriya.png",
      title: "Shape the Future",
      subtitle: "Transform manufacturing with technology and creativity",
      description:
        "Work on real industry challenges and make a lasting impact on the world.",
      ctaText: "Join Now",
      ctaLink: "/register",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const slideVariants = {
    enter: (direction = 1) => ({
      x: 120 * direction,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeInOut" },
    },
    exit: (direction = 1) => ({
      x: -120 * direction,
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.6, ease: "easeInOut" },
    }),
  };

  const contentContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.12 },
    },
  };

  const contentItem = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-linear-to-br from-background-light via-primary-accent/10 to-background-white text-text-primary relative"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <Header/>
      {/* Background Pattern & Wave Image */}
      <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,153,0,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        {/* <WaveImage
          src="/src/assets/kriya.png"
          alt="Decorative curved section"
          className="absolute bottom-0 left-0 w-full h-40 md:h-[180px]"
        /> */}
      </div>

      {/* Professional Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-100 to-orange-50 lg:min-h-screen flex items-center justify-center px-4 sm:px-6 pt-28 pb-28 md:pb-36 lg:pt-24 overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,0.15)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(255,153,0,0.15)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1)_0%,transparent_50%)]"></div>
        </div>

        {/* Floating Color Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full blur-2xl opacity-30"
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-orange-200 to-amber-300 rounded-lg rotate-45 blur-xl opacity-25"
            animate={{
              rotate: [45, 135, 45],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full blur-2xl opacity-20"
            animate={{
              y: [0, 25, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content: wider column so the title fits on one line */}
            <motion.div
              className="lg:col-span-7 text-center lg:text-left space-y-7"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Main Heading */}
              <div className="space-y-5">
                <motion.span
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-orange-600 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Industry–Academia Innovation Challenge
                </motion.span>
                {/* one line on every screen: the size steps down with the width instead of wrapping */}
                <motion.h1
                  className="whitespace-nowrap text-[2.25rem] min-[400px]:text-[2.6rem] leading-none sm:text-6xl lg:text-[3.6rem] xl:text-7xl font-bold tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <span className="text-orange-600">Solve for </span>
                  <span className="text-black">Sakthi</span>
                </motion.h1>
                <div className="mx-auto lg:mx-0 h-1 w-20 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />

                <motion.p
                  className="text-lg sm:text-xl text-gray-700 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Empowering innovation through collaborative problem-solving in
                  <span className="text-black font-semibold"> manufacturing</span> and
                  <span className="text-orange-600 font-semibold"> technology</span>
                </motion.p>
              </div>

              {/* Key Benefits */}
              <motion.div
                className="flex flex-wrap justify-center lg:justify-start gap-3 text-sm font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {KEY_FEATURES.map(({ title }) => (
                  <div key={title} className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-orange-100 shadow-sm">
                    <FaCheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-800">{title}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <Link
                  to="/problemstatements"
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center justify-center group"
                >
                  Explore Challenges
                  <FaArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/interest"
                  className="border-2 border-orange-300 hover:border-orange-500 text-orange-700 hover:text-orange-800 font-semibold py-4 px-8 rounded-xl hover:bg-orange-50 transition-all duration-300 inline-flex items-center justify-center"
                >
                  Submit your Interest
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Content - live numbers: a row of three on tablets, a stacked column beside the text on desktop */}
            <motion.div
              className="lg:col-span-5 w-full max-w-xl mx-auto lg:max-w-none"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:gap-5">
                {[
                  { value: stats?.students, label: "Active Students", icon: <FaUsers className="w-6 h-6" />, bg: "from-gray-500 to-gray-600" },
                  { value: stats?.problems, label: "Challenges", icon: <FaLightbulb className="w-6 h-6" />, bg: "from-orange-500 to-orange-600" },
                  { value: stats?.colleges, label: "Colleges Collaborated", icon: <FaUniversity className="w-6 h-6" />, bg: "from-orange-500 to-red-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="bg-white/90 backdrop-blur p-5 lg:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center gap-4 sm:flex-col sm:text-center lg:flex-row lg:text-left">
                      <div className={`shrink-0 p-3 bg-gradient-to-br ${stat.bg} rounded-xl text-white shadow-lg`}>
                        {stat.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-3xl font-bold text-gray-900 tabular-nums leading-tight">
                          {stat.value === undefined ? <span className="inline-block w-12 h-7 rounded bg-gray-100 animate-pulse align-middle" /> : stat.value.toLocaleString("en-IN")}
                        </div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Wave */}
        <motion.div
          className="absolute bottom-0 left-0 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <WaveImage
            src="/src/assets/kriya.png"
            alt="Decorative wave"
            className="w-full h-32 md:h-48"
          />
        </motion.div>
      </section>

      {/* What is Solve for Sakthi */}
      <section className="py-14 md:py-20 px-4 sm:px-6 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-14"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-5">What is Solve for Sakthi?</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Solve for Sakthi connects students and faculty with real-time industrial challenges from Sakthi Auto,
              enabling them to solve practical problems through industry expert mentorship, collaboration, and innovation.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ABOUT_POINTS.map(({ title, text, icon: Icon }, i) => (
              <motion.div
                key={title}
                className="p-7 rounded-3xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 shadow-md hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                whileHover={{ y: -6 }}
              >
                <div className="w-12 h-12 mb-5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-14 md:py-20 px-4 sm:px-6 bg-gradient-to-br from-background-white via-primary-accent/5 to-background-light relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-orange-600 mb-10 md:mb-14"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Key Features
          </motion.h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {KEY_FEATURES.map(({ title, text, icon: Icon }, i) => (
              <motion.div
                key={title}
                className="text-center p-7 sm:p-10 rounded-3xl bg-white shadow-xl transition-all duration-500 group"
                whileHover={{ scale: 1.03, y: -6 }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.12 * i }}
              >
                <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-primary-accent to-amber-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Icon className="w-9 h-9 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-amber-600 mb-4">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How Solve for Sakthi Works */}
      <section className="py-14 md:py-20 px-4 sm:px-6 bg-gradient-to-br from-primary-accent/5 via-background-white to-background-light relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-orange-600">
              How Solve for Sakthi Works?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From discovering a challenge to taking your solution toward implementation.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {HOW_IT_WORKS.map(({ title, text, icon: Icon }, i) => (
              <motion.div
                key={title}
                className="text-center group shadow-xl p-8 rounded-3xl bg-white transition-all duration-500 hover:scale-105 relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="relative mb-6 w-20 mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-accent to-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-2 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-white">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />

      {/* Call to Action Section */}
      <section className="py-14 md:py-20 px-4 sm:px-6 text-center">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-8 text-orange-600"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Ready to Make an Impact?
        </motion.h2>
        <motion.p
          className="text-lg mb-8 text-gray-600"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          Join our community of innovators and start solving problems that
          matter.
        </motion.p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <Link
            to="/interest"
            className="bg-gradient-to-br from-primary-accent to-amber-600 border border-amber-500 text-background-white font-semibold py-4 px-8 rounded-2xl shadow-card hover:shadow-card-hover hover:scale-105 transition-all duration-300 inline-flex items-center"
          >
            Submit your Interest
          </Link>
          <Link
            to="/register"
            className="bg-white shadow-xl border-primary-accent text-primary-accent font-semibold py-4 px-8 rounded-2xl hover:bg-primary-accent hover:text-background-white transition-all duration-300 hover:scale-105 z-1"
          >
            Sign Up Now
          </Link>
          <Link
            to="/login"
            className="bg-white shadow-xl border-primary-accent text-primary-accent font-semibold py-4 px-8 rounded-2xl hover:bg-primary-accent hover:text-background-white transition-all duration-300 hover:scale-105 z-1"
          >
            Log In
          </Link>
        </div>
      </section>
      <Footer />
    </motion.div>
  );
};

export default Homepage;
