export default function HowItWorksHero() {
  return (
    <section 
      className="py-20 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
          How Cura Works
        </h1>
        <p className="text-xl text-gray-100 max-w-3xl mx-auto mb-8 drop-shadow-md">
          Understanding the technology that powers secure, privacy-preserving medical research collaboration
        </p>
      </div>
    </section>
  );
}