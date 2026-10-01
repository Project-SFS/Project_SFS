/**
 * @file FAQ.jsx
 * @description A static page displaying frequently asked questions and their answers.
 */
import { useState } from "react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  
const faqData = [
  {
    question: "What is Solve for Sakthi?",
    answer:
      "Solve for Sakthi is an innovative initiative connecting students and faculty with real-world industrial challenges. It empowers participants to collaborate, innovate, and develop practical solutions using technology and creativity.",
  },
  {
    question: "Who can participate in Solve for Sakthi?",
    answer:
      "Students and faculty from participating institutions can take part, individually or as teams, based on the challenge requirements.",
  },
  {
    question: "What kind of challenges are offered?",
    answer:
      "Challenges are drawn from real-time industrial needs across manufacturing, quality, automation, digitalisation, sustainability, safety, productivity, and related areas.",
  },
  {
    question: "Can participants choose their preferred challenge?",
    answer:
      "Yes. Participants can explore the available challenges and select one aligned with their interests, knowledge, and capabilities.",
  },
  {
    question: "How do I register?",
    answer:
      "Visit the official Solve for Sakthi registration page and complete the required details. Once registered, you can access available challenges and participate according to the challenge requirements.",
  },
  {
    question: "Will industry experts support the teams?",
    answer:
      "Yes. Selected teams will receive guidance and feedback from Sakthi Auto experts during the solution-development process.",
  },
  {
    question: "What is expected from participants?",
    answer:
      "Participants are expected to understand the problem, develop a practical solution, and clearly present their approach, implementation, and outcomes.",
  },
  {
    question: "How will solutions be evaluated?",
    answer:
      "Solutions may be assessed based on relevance, feasibility, innovation, practicality, scalability, and potential industrial impact.",
  },
  {
    question: "What happens to promising solutions?",
    answer:
      "High-potential solutions may be considered for further validation, pilot testing, refinement, or implementation.",
  },
  {
    question: "Will participants receive recognition?",
    answer:
      "Suitable recognition may be provided for meaningful contributions and high-impact solutions.",
  },
  {
    question: "Can multidisciplinary teams participate?",
    answer:
      "Yes. Cross-disciplinary teams are encouraged where different skills and perspectives can strengthen the solution.",
  },
  {
    question: "How much time is given to solve a challenge?",
    answer:
      "The timeline will depend on the nature and complexity of each challenge. Specific timelines will be communicated for each challenge.",
  },
  {
    question: "Will participants get access to industry data or plant insights?",
    answer:
      "Relevant information may be shared based on the challenge requirements and applicable confidentiality considerations.",
  },
  {
    question: "Who owns the solution or intellectual property developed?",
    answer:
      "IP ownership and usage terms, where applicable, will be communicated clearly for each challenge before participation.",
  },
  {
    question: "Can a solution be taken forward beyond the competition stage?",
    answer:
      "Yes. Promising solutions may progress into validation, prototyping, pilot implementation, or further collaboration.",
  },
  {
    question: "Can faculty members act as mentors or collaborators?",
    answer:
      "Yes. Faculty participation can strengthen problem definition, technical depth, and solution development.",
  },
  {
    question: "How are challenge updates communicated?",
    answer:
      "Important updates, timelines, mentor interactions, and submission requirements will be shared through the Solve for Sakthi platform.",
  },
];



  return (
    <div className="min-h-screen bg-white text-gray-900 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-orange-600 mb-8">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-center text-gray-600 mb-16 max-w-2xl mx-auto leading-relaxed">
          Here you’ll find answers to the most common questions about Solve for Sakthi. 
          If your question isn’t listed, please reach out to our support team.
        </p>

        {/* Accordion */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none  "
              >
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  {item.question}
                </h3>
                <svg
                  className={`w-6 h-6 text-orange-500 transform transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? "max-h-64 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 text-gray-700 leading-relaxed text-base border-t border-gray-100 bg-orange-25 font-medium">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Still have questions? Our team will be happy to assist you.
          </p>
          <a
            href="mailto:support@solveforsakthi.com"
            className="inline-block bg-orange-500 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-orange-700 hover:shadow-lg transition-all duration-300"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;