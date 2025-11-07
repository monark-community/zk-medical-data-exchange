import { CheckCircle, Shield } from "lucide-react";

export default function HowItWorksForPatients() {
  const patientBenefits = [
    'Maintain complete control over your health data',
    'Earn rewards for contributing to medical research',
    'Privacy-first data sharing with zero-knowledge proofs',
    'Help advance medical breakthroughs',
    'Transparent compensation for data contribution'
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold">For Medical Patients</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h4 className="font-semibold mb-4">Your Data Journey</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-teal-600">1</span>
                    </div>
                    <span className="text-sm">Set up your secure wallet</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-teal-600">2</span>
                    </div>
                    <span className="text-sm">Choose what data to share</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-teal-600">3</span>
                    </div>
                    <span className="text-sm">Earn rewards for contributions</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-teal-600">4</span>
                    </div>
                    <span className="text-sm">Track research impact</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-xl font-semibold mb-4">Your Data, Your Control</h3>
              <p className="text-gray-600 mb-6">
                Share your health data securely while maintaining complete privacy and control. 
                Contribute to medical breakthroughs and earn rewards for your valuable contributions.
              </p>
              <ul className="space-y-3">
                {patientBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}