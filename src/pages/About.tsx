
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Users, Target, Zap, Shield, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About Coaching Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionizing personal and professional coaching through the power of artificial intelligence. 
            Our platform combines advanced AI technology with proven coaching methodologies to deliver 
            personalized guidance and actionable insights.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-gray-700 max-w-4xl mx-auto">
                To democratize access to high-quality coaching by leveraging artificial intelligence 
                to provide personalized, scalable, and effective coaching solutions that empower 
                individuals and organizations to achieve their full potential.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold">AI-Powered Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Advanced AI algorithms analyze conversations and provide intelligent insights 
                tailored to each individual's unique coaching needs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold">Personalized Approach</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Every coaching session is customized to the individual's goals, preferences, 
                and communication style for maximum effectiveness.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Target className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold">Goal-Oriented</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Structured coaching processes focused on achieving specific, measurable 
                outcomes and sustainable behavioral changes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold">Real-Time Insights</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Instant analysis and feedback during coaching sessions, with actionable 
                recommendations that can be implemented immediately.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold">Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Enterprise-grade security ensures all coaching conversations and data 
                remain confidential and protected.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Award className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold">Proven Results</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Evidence-based coaching methodologies backed by research and validated 
                through thousands of successful coaching interactions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-white shadow-lg mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Create Your Target</h3>
                <p className="text-gray-600">
                  Add the person you want to coach and define your coaching objectives.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Engage in Conversation</h3>
                <p className="text-gray-600">
                  Our AI facilitates natural conversations to gather insights and build rapport.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Receive Strategies</h3>
                <p className="text-gray-600">
                  Get personalized coaching strategies and actionable recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Our Team</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-600 mb-8">
              We're a diverse team of AI researchers, coaching professionals, and technology experts 
              united by a common goal: making effective coaching accessible to everyone.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold">AI Research Team</h3>
                <p className="text-gray-600">Leading experts in machine learning and natural language processing</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold">Coaching Professionals</h3>
                <p className="text-gray-600">Certified coaches with decades of combined experience</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold">Product Team</h3>
                <p className="text-gray-600">User experience designers and engineers focused on simplicity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
