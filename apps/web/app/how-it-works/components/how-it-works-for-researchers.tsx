import { CheckCircle, Users } from "lucide-react";

export default function HowItWorksForResearchers() {
  const researcherBenefits = [
    'Access to diverse, high-quality medical datasets',
    'Verify data authenticity and integrity',
    'Collaborate globally with privacy guarantees',
    'Accelerate research with AI-powered insights',
    'Publish findings with immutable proof'
  ];

  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold">For Researchers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-4">Transform Your Research</h3>
              <p className="text-gray-600 mb-6">
                Access verified medical data while maintaining patient privacy. Collaborate globally 
                with confidence in data integrity and authenticity.
              </p>
              <ul className="space-y-3">
                {researcherBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h4 className="font-semibold mb-4">Research Workflow</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <span className="text-sm">Connect your research wallet</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <span className="text-sm">Browse verified datasets</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <span className="text-sm">Analyze with privacy guarantees</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-blue-600">4</span>
                  </div>
                  <span className="text-sm">Publish breakthrough findings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}