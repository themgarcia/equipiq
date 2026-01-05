import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EquipIQIcon } from '@/components/EquipIQIcon';

export default function TermsOfService() {
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
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using equipIQ ("the Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            equipIQ is an equipment management and intelligence platform designed for contractors. 
            The Service allows users to track equipment assets, analyze financial data, and manage 
            equipment lifecycle information.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials 
            and for all activities that occur under your account. You agree to notify us immediately 
            of any unauthorized use of your account.
          </p>

          <h2>4. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate and complete information when creating your account</li>
            <li>Use the Service only for lawful purposes</li>
            <li>Not share your account credentials with others</li>
            <li>Keep your equipment data and financial information up to date</li>
          </ul>

          <h2>5. Data Usage</h2>
          <p>
            Your equipment data and financial information are stored securely and used solely to 
            provide the Service. We may use aggregated, anonymized data for analytics and service 
            improvement purposes.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by equipIQ 
            and are protected by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. equipIQ shall not be 
            liable for any indirect, incidental, special, consequential, or punitive damages resulting 
            from your use of the Service.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any 
            material changes via email or through the Service.
          </p>

          <h2>9. Contact</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us through 
            the application.
          </p>
        </div>
      </div>
    </div>
  );
}
