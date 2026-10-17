# Literally Just A File Host

A free, open-source, privacy-focused file hosting service designed to make uploading, organizing, and sharing files straightforward.

**Website:** [literallyjustafilehost.com](https://literallyjustafilehost.com)  

## Overview

Literally Just A File Host is a web-based file hosting platform that provides users with a centralized interface for managing uploaded files. It aims to offer a straightforward alternative to traditional file hosting services, with an emphasis on usability, transparency, and privacy.

The platform includes user authentication, file and folder management, configurable file visibility, share links, CDN delivery, and storage quota enforcement.

## Features

- **File hosting:** Upload files and manage them through a web dashboard.
- **File organization:** Organize uploaded files into folders.
- **File sharing:** Generate links for sharing accessible files.
- **CDN delivery:** Copy CDN links for supported accessible files.
- **Configurable visibility:** Control whether newly uploaded files are accessible by link and adjust visibility for individual files.
- **Storage quotas:** View storage usage and enforce account-specific storage limits.
- **User accounts:** Authenticate and manage account-related settings.
- **User preferences:** Configure default file visibility, preferred link type, and file sorting preferences.
- **Open source:** Explore the source code and contribute to the project.

## Technology Stack

The project uses the following technologies:

- **Next.js** for the web application and API routes.
- **React** for the user interface.
- **TypeScript** for type-safe application development.
- **Neon** for PostgreSQL database hosting.
- **Drizzle ORM** for database access and schema management.
- **Resend** for transactional email delivery.
- **PostgreSQL** for persistent application data.
- **Better Auth** for authentication.
- **Google Drive** for file storage and upload handling.
- **Tailwind CSS** for styling.

## Getting Started

### Prerequisites

Before running the project locally, ensure that you have:

- Node.js and npm installed.
- Access to a PostgreSQL database.
- The required authentication provider credentials.
- Google Drive API credentials and the necessary storage configuration.

### Installation

Clone the repository:

```bash
git clone https://github.com/LiterallyJustAFileHost/repo.git
cd repo
```

Install the dependencies:

```bash
npm install
```

Configure the required environment variables in `.env.local` according to the project's configuration. Do not commit credentials, access tokens, or other secrets.

Apply the database migrations:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** The application requires valid database, authentication, and storage configuration. Additional environment variables may be necessary depending on the selected providers and deployment environment.

## Configuration

The application relies on environment variables for service credentials and configuration. Refer to the project's configuration files and existing environment variable declarations for the required names and values.

Do not publish `.env.local` or expose production credentials in source control.

## Development

Run the production build:

```bash
npm run build
```

Run the TypeScript compiler checks:

```bash
npx tsc --noEmit
```

Run ESLint:

```bash
npx eslint .
```

These commands help identify build errors, type errors, and linting issues during development.

## Privacy and Security

Privacy and security are important design considerations for Literally Just A File Host.

- Files are inaccessible by default unless the user changes the default visibility preference.
- Public share endpoints enforce file visibility before allowing access.
- Storage quotas are enforced during uploads.
- The application uses third-party providers for services such as authentication, database hosting, and file storage.

Users should review the [Privacy Policy](https://literallyjustafilehost.com/privacy-policy) and [Terms of Service](https://literallyjustafilehost.com/terms-of-service) for details about data handling and service usage.

As with any online service, users should avoid uploading sensitive information unless they understand the service's data handling practices and associated risks.

## Contributing

Contributions, bug reports, and suggestions are welcome.

To contribute:

1. Review the existing codebase and project structure.
2. Identify an issue or improvement.
3. Make changes in a separate branch.
4. Test the changes locally.
5. Submit a pull request describing the changes and their purpose.

Please keep changes focused, maintain consistency with the existing implementation, and avoid committing credentials or sensitive information.

## License

Refer to the repository's license file for the applicable license and redistribution terms.

## Links

- **Website:** [literallyjustafilehost.com](https://literallyjustafilehost.com)
- **Privacy Policy:** [Privacy Policy](https://literallyjustafilehost.com/privacy-policy)
- **Terms of Service:** [Terms of Service](https://literallyjustafilehost.com/terms-of-service)
