import React, { useState, useEffect } from 'react';
import { Certificate } from '../types';
import { getCertificates, getCertificateDownloadUrl } from '../services/api';
import { useAuthStore } from '../store/auth';
import { BackButton } from '../components/common/BackButton';
import { Download, Share2, Award, Calendar, GraduationCap, FileText } from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCertificates();
      setCertificates(data);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('Failed to load certificates. Please try again.');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificate: Certificate) => {
    if (!user) return;
    const url = getCertificateDownloadUrl(certificate.courseId, certificate.userId);
    window.open(url, '_blank');
  };

  const handleShare = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${certificate.courseName} Certificate`,
          text: `I completed ${certificate.courseName} with ${certificate.completionPercentage}%!`,
          url: certificate.certificateUrl
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(certificate.certificateUrl);
        alert('Certificate URL copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy certificate URL. Please try downloading instead.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
          <div className="flex items-center space-x-4 mb-4">
            <BackButton showHome />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Award className="w-8 h-8 mr-3 text-indigo-600" />
                Your Certificates
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                View and download your course completion certificates
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Certificates Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Complete courses to earn certificates. Your certificates will appear here once you finish a course.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Certificate Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Award className="w-10 h-10" />
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                      {certificate.grade}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">
                    {certificate.courseName}
                  </h3>
                  <div className="flex items-center text-sm text-white/90">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(certificate.issuedDate)}
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Completion
                      </span>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {certificate.completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${certificate.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-6">
                    <button
                      onClick={() => handleDownload(certificate)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => handleShare(certificate)}
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {certificates.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Certificates</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {certificates.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Grade</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {certificates.length > 0
                      ? (
                          certificates.reduce((sum, cert) => {
                            const gradeNum = parseFloat(cert.grade.replace(/[^0-9.]/g, ''));
                            return sum + (isNaN(gradeNum) ? 0 : gradeNum);
                          }, 0) / certificates.length
                        ).toFixed(1)
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Completion</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {certificates.length > 0
                      ? Math.round(
                          certificates.reduce((sum, cert) => sum + cert.completionPercentage, 0) /
                            certificates.length
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;

