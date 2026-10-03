/**
 * @file About.jsx
 * @description A static page providing information about the project or organization.
 */
import React from "react";
import { motion } from "framer-motion";
import {
  FaGlobe,
  FaHandshake,
  FaLightbulb,
  FaGraduationCap,
  FaBuilding,
  FaTools,
  FaChartLine,
  FaCheckCircle,
  FaLaptopCode,
} from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Animation variant for a consistent fade-in-up effect
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

// Color Scheme Variables (Consistent and Professional)
const ACCENT_COLOR = "text-[#FF9800]"; // Rich Amber/Orange
const ACCENT_BG = "bg-[#FF9800]"; // Rich Amber/Orange Background
const TEXT_COLOR = "text-[#212529]"; // Dark Gray/Black
const LIGHT_BG = "bg-gray-50"; // Subtle Light Gray Background

// Data for sections
const visionData = [
  {
    icon: FaLightbulb,
    title: "Pioneering",
    desc: "Leading the development of new technologies and smart methodologies for industry.",
  },
  {
    icon: FaHandshake,
    title: "Collaborative",
    desc: "Seamlessly bridging academia and industry through shared resources and expert knowledge.",
  },
  {
    icon: FaGlobe,
    title: "Impactful",
    desc: "Creating measurable, deep, and positive change in the economic and technological landscape.",
  },
];

const impactData = [
  {
    icon: FaCheckCircle,
    title: "100+ Solutions Deployed",
    stat: "Challenges Solved",
    desc: "Successfully turning challenging industry needs into scalable, working prototypes and deployments.",
  },
  {
    icon: FaChartLine,
    title: "45% Operational Efficiency",
    stat: "Average Improvement",
    desc: "Projects focused on data-driven optimization, significantly boosting production and supply chain metrics.",
  },
  {
    icon: FaLaptopCode,
    title: "500+ Engineers Mentored",
    stat: "Future Innovators Trained",
    desc: "Empowering students with hands-on, industry-relevant experience and professional mentorship.",
  },
];

const teamData = [
  {
    icon: FaBuilding,
    title: "Administrators - SACL",
    desc: "Oversee strategic operations, govern the platform, and ensure world-class quality and adherence to standards.",
  },
  {
    icon: FaHandshake,
    title: "Evaluators & Mentors",
    desc: "Industry experts who guide participants, providing invaluable domain expertise and professional excellence.",
  },
  {
    icon: FaGraduationCap,
    title: "SPOCs & Student Teams",
    desc: "The creative core, collaborating tirelessly to develop impactful, technologically-driven, real-world innovations.",
  },
];

// Sub-components
const HeroSection = () => (
  <section className="relative overflow-hidden border-b border-gray-100 bg-white">
    {/* subtle pattern background */}
    <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAnIGhlaWdodD0nMTAnIHZpZXdCb3g9JzAgMCAxMCAxMCc+CiAgPGcgb3BhY2l0eT0nMC41JyBmaWxsPScjNjM2MzYzJz4KICAgIDxyZWN0IHdpZHRoPScxMCcgaGVpZHRoPScxMCcgeD0nMCcgeT0nMCcgLz4KICAgIDxwYXRoIGQ9J00xMCAwTDAgMTVWMTBaJyBzdHJva2U9JyNmZmYnIHN0cm9rZS13aWR0aD0nMC4zNScgLz4KICA8L2c+Cjwvc3ZnPg==')]" />

    <div className="relative max-w-8xl mx-auto px-6 lg:px-25 pt-28 pb-20 lg:pt-32 lg:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-26 items-center lg:mt-6">
        {/* Left: Text */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={fadeInUp}
          viewport={{ once: true }}
          className="space-y-4 sm:space-y-6 text-center lg:text-left"
        >
          <p className="inline-flex items-center px-3 sm:px-4 py-1 rounded-full border border-amber-200 bg-amber-50 text-xs font-semibold tracking-[0.2em] uppercase text-[#FF9800]">
            Solve for Sakthi
          </p>

          <h1
            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight ${TEXT_COLOR}`}
          >
            Driving the Future of
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              Academia-Industry Collaboration
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 text-justify lg:text-left mx-auto lg:mx-0 leading-relaxed max-w-xl">
            <span className="font-semibold text-[#FF9800]">Solve for Sakthi</span> is the
            strategic nexus that transforms{" "}
            <span className="font-semibold">
              real-world manufacturing, supply chain, and technology
            </span>{" "}
            challenges into high-impact learning and innovation opportunities.
          </p>

          <div className="flex flex-col items-center justify-center lg:justify-start gap-4">
            <motion.a
              href="/problemstatements"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center justify-center px-6 sm:px-7 py-2.5 text-sm sm:text-base font-semibold rounded-full ${ACCENT_BG} text-white shadow-lg hover:shadow-xl transition`}
            >
              Explore Our Challenges
            </motion.a>

            <p className="text-xs sm:text-sm text-gray-500 text-center lg:text-left">
              Start solving real-world problems with industry-aligned projects.
            </p>
          </div>
        </motion.div>

        {/* Right: Highlight Card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { duration: 0.7, delay: 0.15 } } }}
          viewport={{ once: true }}
          className="relative transform hover:scale-[1.02] transition duration-500"
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-200/70 via-transparent to-orange-100/70 blur-xl" />
          <div className="relative bg-white border border-gray-100 rounded-3xl shadow-2xl px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8 space-y-4 sm:space-y-6">
            <h3 className={`text-base sm:text-lg lg:text-xl font-bold ${TEXT_COLOR}`}>
              Why Solve for Sakthi?
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 text-justify leading-relaxed">
              A cohesive platform where{" "}
              <span className="font-semibold">academia</span> meets{" "}
              <span className="font-semibold">industry</span>, enabling students to solve
              practical problems while industries gain relevant, scalable solutions.
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
              <div className="p-2 sm:p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className={`font-bold ${ACCENT_COLOR}`}>100+</p>
                <p className="mt-1 text-gray-600">Challenges</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className={`font-bold ${ACCENT_COLOR}`}>20+</p>
                <p className="mt-1 text-gray-600">Partner Industries</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className={`font-bold ${ACCENT_COLOR}`}>500+</p>
                <p className="mt-1 text-gray-600">Students Engaged</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const MissionSection = () => (
  <section className={`py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-10 ${LIGHT_BG}`}>
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 items-start">
      <motion.div
        initial="hidden"
        whileInView="visible"
        variants={fadeInUp}
        viewport={{ once: true }}
        className="lg:col-span-2"
      >
        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${ACCENT_COLOR}`}>
          Our Mission
        </h2>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-4 sm:mb-6">
          Building the bridge between classrooms and factories
        </p>

        <div className="space-y-4 sm:space-y-5 text-sm sm:text-base md:text-lg text-gray-700 leading-7 sm:leading-8 text-justify">
          <p>
            Our core mission is to{" "}
            <span className="font-semibold">build a dynamic ecosystem</span> where innovation
            is a fundamental outcome. We achieve this by strategically connecting eager
            learners with established industry experts, effectively bridging the gap between
            theoretical knowledge and practical application.
          </p>
          <p>
            This collaborative approach transforms academic concepts into{" "}
            <span className="font-semibold">tangible, scalable industrial solutions</span>.
            Through carefully structured projects, we cultivate a new generation of technical
            leaders prepared to drive India's manufacturing and technology transformation
            forward.
          </p>
          <p>
            We are committed to fostering an environment of continuous learning and growth,
            where students can develop practical skills through hands-on experience with real
            industrial challenges. Ultimately, we aim to build a strong pipeline of future
            engineers equipped to tackle the complexities of a rapidly evolving global market.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { duration: 0.7, delay: 0.2 } } }}
        viewport={{ once: true }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 lg:p-9 transform hover:scale-[1.02] transition duration-500 border-t-4"
      >
        <h3 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${TEXT_COLOR}`}>Core Values</h3>
        <ul className="space-y-4 sm:space-y-5 text-gray-700 text-sm sm:text-base">
          <li className="flex items-start">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-100 mr-3 flex-shrink-0">
              <FaLightbulb className={`${ACCENT_COLOR} text-lg sm:text-xl`} />
            </span>
            <p>
              <b>Continuous Innovation</b>: Encouraging creative and boundary-pushing
              solutions in every challenge.
            </p>
          </li>
          <li className="flex items-start">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-100 mr-3 flex-shrink-0">
              <FaTools className={`${ACCENT_COLOR} text-lg sm:text-xl`} />
            </span>
            <p>
              <b>Sustainable Growth</b>: Building solutions that are robust, responsible,
              and capable of long-term evolution.
            </p>
          </li>
          <li className="flex items-start">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-100 mr-3 flex-shrink-0">
              <FaGraduationCap className={`${ACCENT_COLOR} text-lg sm:text-xl`} />
            </span>
            <p>
              <b>Excellence & Mentorship</b>: Delivering consistent quality and fostering
              trust and knowledge transfer.
            </p>
          </li>
        </ul>
      </motion.div>
    </div>
  </section>
);

const VisionSection = () => (
  <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-10 bg-[#212529] text-white">
    <div className="max-w-7xl mx-auto text-center">
      <motion.h2
        initial="hidden"
        whileInView="visible"
        variants={fadeInUp}
        viewport={{ once: true }}
        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
      >
        Our Strategic Vision
      </motion.h2>
      <motion.p
        initial="hidden"
        whileInView="visible"
        variants={{
          ...fadeInUp,
          visible: {
            ...fadeInUp.visible,
            transition: { duration: 0.7, delay: 0.1, ease: "easeOut" },
          },
        }}
        viewport={{ once: true }}
        className="text-sm sm:text-base md:text-xl leading-relaxed mb-10 sm:mb-14 text-gray-300 max-w-4xl mx-auto"
      >
        To establish ourselves as a premier, world-class innovation hub dedicated to empowering
        both industries and educational institutions to co-create high-impact, technologically
        advanced, and sustainable solutions globally.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
        {visionData.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-6 sm:p-7 md:p-8 bg-white text-[#212529] rounded-2xl shadow-xl border border-gray-100 border-b-4 border-b-transparent hover:border-b-[#FF9800] transition duration-300 transform hover:translate-y-[-4px]"
          >
            <div className="flex items-center justify-center mb-4">
              <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                <Icon className={`${ACCENT_COLOR} text-xl sm:text-2xl`} />
              </span>
            </div>
            <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-3 ${TEXT_COLOR}`}>{title}</h3>
            <p className="text-gray-600 text-sm sm:text-base">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const ImpactSection = () => (
  <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-10 bg-white">
    <div className="max-w-7xl mx-auto text-center">
      <motion.h2
        initial="hidden"
        whileInView="visible"
        variants={fadeInUp}
        viewport={{ once: true }}
        className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${TEXT_COLOR}`}
      >
        Our Impact in Action
      </motion.h2>
      <motion.p
        initial="hidden"
        whileInView="visible"
        variants={{
          ...fadeInUp,
          visible: {
            ...fadeInUp.visible,
            transition: { duration: 0.7, delay: 0.1, ease: "easeOut" },
          },
        }}
        viewport={{ once: true }}
        className="text-sm sm:text-base md:text-xl leading-relaxed mb-10 sm:mb-14 text-gray-600 max-w-4xl mx-auto"
      >
        We measure our success by the real-world value we generate, delivering tangible results
        across the entire manufacturing and technology value chain.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
        {impactData.map(({ icon: Icon, title, stat, desc }, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-6 sm:p-8 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-2xl transition duration-300"
          >
            <div className="flex items-center justify-center mb-4 sm:mb-5">
              <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                <Icon className={`${ACCENT_COLOR} text-2xl sm:text-3xl`} />
              </span>
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-1 ${TEXT_COLOR}`}>{title}</h3>
            <p className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 ${ACCENT_COLOR}`}>{stat}</p>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const TeamSection = () => (
  <section className={`py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-10 ${LIGHT_BG}`}>
    <div className="max-w-7xl mx-auto text-center">
      <motion.h2
        initial="hidden"
        whileInView="visible"
        variants={fadeInUp}
        viewport={{ once: true }}
        className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${TEXT_COLOR}`}
      >
        The Ecosystem & Our Contributors
      </motion.h2>
      <motion.p
        initial="hidden"
        whileInView="visible"
        variants={{
          ...fadeInUp,
          visible: {
            ...fadeInUp.visible,
            transition: { duration: 0.7, delay: 0.1, ease: "easeOut" },
          },
        }}
        viewport={{ once: true }}
        className="text-sm sm:text-base md:text-lg leading-relaxed mb-10 sm:mb-14 text-gray-600 max-w-3xl mx-auto"
      >
        A collaborative network of administrators, mentors, SPOCs, and student teams aligned
        towards building impactful, sustainable solutions.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
        {teamData.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-md transition duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-center justify-center mb-4">
              <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                <Icon className={`${ACCENT_COLOR} text-xl sm:text-2xl`} />
              </span>
            </div>
            <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-3 ${TEXT_COLOR}`}>{title}</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const About = () => {
  return (
    <div className={`min-h-screen ${LIGHT_BG} ${TEXT_COLOR} scroll-smooth`}>
      <Header />
      <HeroSection />
      <MissionSection />
      <VisionSection />
      <ImpactSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default About;
