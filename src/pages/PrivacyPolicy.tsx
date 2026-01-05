import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EquipIQIcon } from '@/components/EquipIQIcon';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/auth">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <EquipIQIcon className="h-8 w-8" />
            <span className="text-xl font-bold">equipIQ</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>

          <h2>1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul>
            <li><strong>Account Information:</strong> Email address, full name, and password when you create an account</li>
            <li><strong>Equipment Data:</strong> Information about your equipment including make, model, year, purchase price, and financial details</li>
            <li><strong>Usage Data:</strong> How you interact with the Service, including pages visited and features used</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Process and complete transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Generate aggregated analytics to improve the Service</li>
          </ul>

          <h2>3. Data Storage and Security</h2>
          <p>
            Your data is stored securely using industry-standard encryption and security practices. 
            We use secure cloud infrastructure to protect your information from unauthorized access, 
            alteration, or destruction.
          </p>

          <h2>4. Data Sharing</h2>
          <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
          <ul>
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With service providers who assist in operating the Service (under strict confidentiality agreements)</li>
          </ul>

          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and receive a copy of your data</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of certain data collection practices</li>
          </ul>

          <h2>6. Cookies and Tracking</h2>
          <p>
            We use essential cookies to maintain your session and preferences. We do not use 
            third-party advertising cookies or tracking technologies.
          </p>

          <h2>7. Children's Privacy</h2>
          <p>
            The Service is not intended for users under 18 years of age. We do not knowingly 
            collect information from children under 18.
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please 
            contact us through the application.
          </p>
        </div>
      </div>
    </div>
  );
}
