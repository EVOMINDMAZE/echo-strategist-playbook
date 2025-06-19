
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Target, Users, Lightbulb, Award, TrendingUp, Heart } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Target,
      title: "Precision",
      description: "Every coaching strategy is tailored specifically to your unique situation and goals."
    },
    {
      icon: Users,
      title: "Empowerment",
      description: "We believe in unlocking the potential that already exists within you."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Cutting-edge AI technology meets proven coaching methodologies."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We're committed to delivering exceptional results and experiences."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Professionals Coached" },
    { number: "95%", label: "Success Rate" },
    { number: "50+", label: "Industries Served" },
    { number: "24/7", label: "Support Available" }
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
              <Button variant="default" onClick={() => navigate('/about')}>
                About
              </Button>
              <Button variant="ghost" onClick={() => navigate('/pricing')}>
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
            Revolutionizing
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Professional Coaching
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
            We're on a mission to democratize access to world-class coaching by combining 
            artificial intelligence with proven coaching methodologies.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Born from the frustration of inaccessible, expensive, and one-size-fits-all coaching solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">The Challenge</h3>
              <p className="text-gray-600 mb-6">
                Traditional coaching is expensive, hard to access, and often doesn't adapt to your unique 
                situation. We saw talented professionals struggling to reach their potential simply because 
                they couldn't access quality coaching when they needed it most.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Solution</h3>
              <p className="text-gray-600">
                We built an AI-powered coaching platform that learns from your specific challenges, 
                adapts to your learning style, and provides personalized strategies 24/7. It's like 
                having a world-class coach in your pocket, available whenever you need guidance.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Our Mission</h3>
              <p className="text-gray-700 text-center">
                To make professional coaching accessible, affordable, and effective for everyone, 
                regardless of their background or budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Powered by Advanced AI
          </h2>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Our platform uses state-of-the-art artificial intelligence to understand your unique situation, 
            learn from your interactions, and continuously improve the coaching strategies we provide.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Adaptive Learning</h3>
              <p className="text-gray-600">Our AI learns from every interaction to provide increasingly personalized advice.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Goal-Focused</h3>
              <p className="text-gray-600">Every strategy is tailored to help you achieve your specific objectives.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Innovative Approach</h3>
              <p className="text-gray-600">Combining proven coaching methods with cutting-edge AI technology.</p>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6"
          >
            Experience the Future of Coaching
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Unlock Your Potential?
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Join the thousands of professionals who have transformed their careers with our AI-powered coaching platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-6"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6"
            >
              View Pricing Plans
            </Button>
          </div>
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
                <button onClick={() => navigate('/pricing')} className="block text-gray-400 hover:text-white">
                  Pricing
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

export default About;
