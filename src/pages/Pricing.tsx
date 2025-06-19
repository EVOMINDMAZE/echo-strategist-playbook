
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Star, Zap, Shield, Users } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();

  const features = {
    free: [
      "3 coaching sessions per month",
      "Basic target tracking",
      "Email support",
      "Mobile app access"
    ],
    pro: [
      "Unlimited coaching sessions",
      "Advanced analytics & insights",
      "Custom target creation",
      "Priority support",
      "Progress tracking & reports",
      "Goal achievement framework",
      "Personalized action plans",
      "Success metrics dashboard"
    ],
    enterprise: [
      "Everything in Pro",
      "Team management dashboard",
      "Advanced reporting suite",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "Advanced security features",
      "24/7 phone support"
    ]
  };

  const faqs = [
    {
      question: "How does the free trial work?",
      answer: "Start with a 14-day free trial of our Pro plan. No credit card required. Experience all premium features before deciding."
    },
    {
      question: "Can I switch plans anytime?",
      answer: "Absolutely! Upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing."
    },
    {
      question: "What makes your coaching different?",
      answer: "Our AI learns from your specific situation and adapts coaching strategies in real-time, providing personalized guidance 24/7."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use enterprise-grade security with end-to-end encryption. Your coaching sessions are completely private and secure."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              >
                Coaching Assistant
              </button>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button variant="ghost" onClick={() => navigate('/about')}>
                About
              </Button>
              <Button variant="default" onClick={() => navigate('/pricing')}>
                Pricing
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>

            <div className="md:hidden flex items-center">
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Invest in Your
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Success
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
            Choose the perfect plan to accelerate your growth. Start with our free trial 
            and experience the transformation for yourself.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>14-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>No Setup Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="relative shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
                <CardTitle className="text-2xl mb-2">Starter</CardTitle>
                <CardDescription className="text-gray-600">Perfect for getting started</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  $0<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <ul className="space-y-4 mb-8">
                  {features.free.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full py-6 text-lg"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-blue-500 shadow-xl hover:shadow-2xl transition-shadow duration-300 scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl mb-2">Professional</CardTitle>
                <CardDescription className="text-gray-600">For serious growth and development</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  $29<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Billed monthly</p>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <ul className="space-y-4 mb-8">
                  {features.pro.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  14-day free trial, then $29/month
                </p>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                <CardDescription className="text-gray-600">For teams and organizations</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  $99<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Per team (up to 50 users)</p>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <ul className="space-y-4 mb-8">
                  {features.enterprise.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full py-6 text-lg"
                  onClick={() => navigate('/auth')}
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Why Invest in Professional Coaching?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            The average professional sees a 500% ROI from quality coaching within 6 months
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">40%</div>
              <p className="text-gray-700">Average increase in productivity</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">67%</div>
              <p className="text-gray-700">Report achieving major goals faster</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">89%</div>
              <p className="text-gray-700">Experience improved job satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Your Transformation Today
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Join thousands of professionals who have already transformed their careers. 
            Try our Professional plan free for 14 days.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/about')}
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6"
            >
              Learn More About Us
            </Button>
          </div>

          <p className="text-blue-100 text-sm mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Coaching Assistant</div>
              <p className="text-gray-400">
                Empowering professionals with AI-driven coaching solutions.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/')} className="block text-gray-400 hover:text-white">
                  Home
                </button>
                <button onClick={() => navigate('/about')} className="block text-gray-400 hover:text-white">
                  About
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <a href="mailto:support@coachingassistant.com" className="block text-gray-400 hover:text-white">
                  Contact Us
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white">
                  Privacy Policy
                </a>
                <a href="#" className="block text-gray-400 hover:text-white">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Coaching Assistant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
