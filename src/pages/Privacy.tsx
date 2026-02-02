import CommonLayout from "../components/CommonLayout";

const Privacy = () => {
  return (
    <CommonLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary">Privacy Policy</h1>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Introduction</h2>
            <p className="text-foreground leading-relaxed">
              Welcome to "Distriator," a social media application developed by SN AnyDevice Software Solutions. Your privacy is of utmost importance to us. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our app.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">1. Information We Collect</h2>
            <p className="text-foreground leading-relaxed">
              When you use "Distriator," we may collect the following types of information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>
                <strong>Personal Information:</strong> This includes information such as your name, email address, profile picture, and other details you provide when creating an account.
              </li>
              <li>
                <strong>Content:</strong> Any images, memes, GIFs, comments, or other content you upload or share on the app.
              </li>
              <li>
                <strong>Interaction Data:</strong> Information on how you interact with the app, such as your replies to comments, bookmarked content, and templates created for replies.
              </li>
              <li>
                <strong>Device Information:</strong> Information about the device you use to access the app, including the device type, operating system, and IP address.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">2. How We Use Your Information</h2>
            <p className="text-foreground leading-relaxed">
              The information we collect is used for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>
                <strong>Providing Services:</strong> To allow you to interact with other users, reply to comments, and use other features such as attaching images, creating templates, and bookmarking comments.
              </li>
              <li>
                <strong>Improving User Experience:</strong> To understand how users interact with the app and make improvements based on feedback and usage patterns.
              </li>
              <li>
                <strong>Security and Safety:</strong> To monitor and prevent any misuse of the app, such as by allowing users to block or report other users or content.
              </li>
              <li>
                <strong>Communication:</strong> To send you updates, notifications, and other communications related to the app.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">3. Sharing Your Information</h2>
            <p className="text-foreground leading-relaxed">
              We do not share your personal information with third parties except in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>
                <strong>Legal Compliance:</strong> If required by law, we may share your information with law enforcement or other governmental authorities.
              </li>
              <li>
                <strong>Protection of Rights:</strong> If necessary, we may disclose your information to protect our rights, users, or the public.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">4. Your Choices</h2>
            <p className="text-foreground leading-relaxed">
              You have the following options regarding your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>
                <strong>Managing Content:</strong> You can delete or edit any content you have posted at any time.
              </li>
              <li>
                <strong>Blocking/Reporting:</strong> You can block or report other users or content as needed.
              </li>
              <li>
                <strong>Account Deletion:</strong> You can delete your account at any time. Upon deletion, all your data will be removed from our servers, except where retention is required by law.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">5. Security</h2>
            <p className="text-foreground leading-relaxed">
              We take the security of your data seriously and implement industry-standard measures to protect it. However, no method of transmission over the internet is 100% secure, so we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">6. Changes to This Privacy Policy</h2>
            <p className="text-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the effective date will be updated accordingly. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">7. Contact Us</h2>
            <p className="text-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us at{" "}
              <a 
                href="mailto:sagar@techcoderlabz.com" 
                className="text-primary hover:underline"
              >
                sagar@techcoderlabz.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </CommonLayout>
  );
};

export default Privacy;
