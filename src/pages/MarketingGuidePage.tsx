import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BookOpen,
  CheckCircle
} from 'lucide-react';
import { BackButton } from '../components/common/BackButton';
import { Course } from '../types';
import { apiService } from '../services/api';

interface MarketingTemplate {
  id: string;
  title: string;
  description: string;
  platform: string;
  template: string;
  tags: string[];
}

interface MarketingGuidePageProps {
  guideType?: 'marketing' | 'revenue';
}

export const MarketingGuidePage: React.FC<MarketingGuidePageProps> = ({ guideType = 'marketing' }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const courseId = searchParams.get('courseId');
  
  const [course, setCourse] = useState<Course | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  const marketingTemplates: MarketingTemplate[] = [
    {
      id: '1',
      title: 'Engaging Question & Problem/Solution Focus',
      description: 'Perfect for LinkedIn, Facebook, and Instagram. Focuses on problem-solving and career growth.',
      platform: 'LinkedIn, Facebook, Instagram',
      template: `Are you ready to unlock [Specific Skill]? 🤔 Many struggle with [Common Pain Point], but I've distilled years of experience into my new SkillStream course!

Learn [Key Benefit 1] and [Key Benefit 2]. It's high-level education, designed for you to succeed.

Enroll now and transform your skills!

➡️ Link to my course: [YOUR SKILLSTREAM COURSE LINK]

#SkillStream #OnlineLearning #Upskill #[YourSkillTopic] #CareerGrowth #Education #[YourName]`,
      tags: ['problem-solving', 'career growth', 'engagement']
    },
    {
      id: '2',
      title: 'Direct & Benefit-Driven Announcement',
      description: 'Great for X/Twitter, LinkedIn, and Facebook. Perfect for quick announcements.',
      platform: 'X/Twitter, LinkedIn, Facebook',
      template: `Exciting news! My new course, [Your Course Title], is now live on SkillStream!

Get ready for high-level education at a low cost, focusing on [Specific Outcome 1] and [Specific Outcome 2].

Start learning today!

🔗 Enroll here: [YOUR SKILLSTREAM COURSE LINK]

#[YourCourseTopic] #SkillStream #OnlineCourse #LearnFromHome #ProfessionalDevelopment #NewSkills`,
      tags: ['announcement', 'benefits', 'direct']
    },
    {
      id: '3',
      title: 'Personal Invitation & Community Focus',
      description: 'Ideal for Instagram, Facebook, and LinkedIn. Creates connection and community feeling.',
      platform: 'Instagram, Facebook, LinkedIn',
      template: `I'm thrilled to invite you to my course, [Your Course Title], now available on SkillStream!

I've poured my best knowledge into creating content that helps you [Specific Goal] step-by-step. SkillStream makes quality education accessible to everyone.

Join a community of learners and transform your capabilities. Let's learn together!

Click to enroll: [YOUR SKILLSTREAM COURSE LINK]

#SkillStreamCommunity #OnlineEducation #[YourSkillTopic] #LifelongLearning #Empowerment`,
      tags: ['community', 'personal', 'invitation']
    },
    {
      id: '4',
      title: 'Platform Promotion (for Influencers)',
      description: 'For tutors who are also influencers. Promotes the broader SkillStream platform.',
      platform: 'LinkedIn, Facebook, YouTube Community',
      template: `As an instructor on SkillStream, I'm constantly amazed by the high-quality learning journeys unfolding on the platform! It's truly building an accessible and scalable platform for everyone.

From [Course Category 1] to [Course Category 2], you'll find top-tier content. If you're looking to upskill, this is your go-to.

Check out all the incredible courses available: [SKILLSTREAM PLATFORM GENERAL LINK]

#SkillStream #QualityEducation #CommunityLearning #OnlineLMS #Upskilling #EducationForAll`,
      tags: ['platform', 'influencer', 'quality']
    }
  ];

  useEffect(() => {
    if (courseId) {
      apiService
        .getCourseMarketingDetails(Number(courseId))
        .then((data) => setCourse(data as Course))
        .catch((error) => {
          console.error('Error loading marketing course details:', error);
          setCourse(null);
        });
    }
  }, [courseId]);

  const customizeTemplate = (template: MarketingTemplate) => {
    if (!course) return;
    let customized = template.template;
    customized = customized.replace(/\{courseTitle\}/g, course.title || '');
    customized = customized.replace(/\{courseDescription\}/g, course.description || '');
    customized = customized.replace(/\{courseCategory\}/g, course.category || '');
    customized = customized.replace(/\{coursePrice\}/g, course.price?.toString() || '0');
    customized = customized.replace(/\{enrolledStudents\}/g, course.enrolledStudents?.toString() || '0');
    customized = customized.replace(/\{completionRate\}/g, course.completionRate?.toString() || '0');
    customized = customized.replace(/\{revenue\}/g, course.revenue?.toString() || '0');
    setCustomMessage(customized);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCustomMessage(type);
    setTimeout(() => setCustomMessage(''), 2000);
  };

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(customMessage);
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://skillstream.com')}&title=${encodeURIComponent(course?.title || '')}&summary=${encodeURIComponent(customMessage)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://skillstream.com')}&quote=${text}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank');
  };

  const isRevenueGuide = guideType === 'revenue';

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading marketing guide...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <BackButton />
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isRevenueGuide ? 'How to Grow Your Revenue!' : 'How to Grow Your Creative Reach!'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {isRevenueGuide
                    ? 'Revenue-focused strategies and templates to help you boost your earnings on SkillStream.'
                    : 'Marketing templates and strategies to promote your course'}
                </p>
              </div>
            </div>
          </div>

          {/* Course Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {course.description}
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4 inline mr-1" />
                    {course.enrolledStudents} students
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    <Target className="h-4 w-4 inline mr-1" />
                    {course.completionRate}% completion
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    ${(course.revenue ?? 0).toLocaleString()} revenue
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${course.price}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Course price</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            📝 General Instructions for Tutors
          </h3>
          <div className="space-y-3 text-blue-800 dark:text-blue-200">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>Choose Your Course:</strong> The course details above are pre-filled for your convenience.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>Copy & Customize:</strong> Select a template below, copy the text, and customize the bracketed information [ ] to make it unique to your course and personal brand.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>Add Your Link:</strong> The course link is automatically included in the templates.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>Add an Image/Video:</strong> Posts with visuals get more engagement! Use an eye-catching image from your course, a short video teaser, or even a personal photo.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Template Selection */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Marketing Templates
            </h3>
            <div className="space-y-4">
              {marketingTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    customMessage === template.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => customizeTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {template.title}
                    </h4>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                      {template.platform}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customized Text Preview */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Customized Text Preview
            </h3>
            {customMessage ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Preview
                    </span>
                    <button
                      onClick={() => handleCopy(customMessage, 'text')}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {customMessage === 'text' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Copy Text
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {customMessage}
                  </div>
                </div>

                {/* Social Media Share Buttons */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Share Directly
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Share on X
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Share on LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Share on Facebook
                    </button>
                    <button
                      onClick={() => handleCopy(customMessage, 'instagram')}
                      className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      {customMessage === 'instagram' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Copy for Instagram
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Course Link */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Course Link
                  </h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`https://skillstream.com/courses/${course.id}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={() => handleCopy(`https://skillstream.com/courses/${course.id}`, 'link')}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {customMessage === 'link' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a template from the left to see your customized marketing text here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Tips */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💡 Additional Marketing Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Best Times to Post</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• LinkedIn: Tuesday-Thursday, 8-10 AM or 5-6 PM</li>
                <li>• Facebook: Thursday-Sunday, 1-4 PM</li>
                <li>• Instagram: Wednesday, 11 AM-1 PM or 7-9 PM</li>
                <li>• Twitter: Monday-Thursday, 8-10 AM or 6-9 PM</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Engagement Boosters</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• Ask questions to encourage comments</li>
                <li>• Use relevant hashtags (3-5 per post)</li>
                <li>• Include call-to-action phrases</li>
                <li>• Share student success stories</li>
                <li>• Post behind-the-scenes content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 