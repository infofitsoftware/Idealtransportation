# Ideal Transportation Solutions

A modern web application for a logistics company that includes a public-facing website and an admin dashboard.

## Features

### Public Website
- Modern, responsive design
- Service information
- Company history and team
- Contact form
- Google Maps integration

### Admin Dashboard
- Secure authentication
- Daily transaction management
- Analytics and reporting
- Data export capabilities

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form
- **Authentication**: JWT
- **Styling**: Tailwind CSS with custom configuration
- **Type Safety**: TypeScript
- **Code Quality**: ESLint, Prettier

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with required environment variables:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
   JWT_SECRET=your_jwt_secret
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable React components
│   ├── lib/             # Utility functions and helpers
│   └── styles/          # Global styles and Tailwind config
├── public/              # Static assets
└── package.json         # Project dependencies and scripts
```

## Development

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Lint code: `npm run lint`

## Deployment

The application is configured for deployment on AWS:
- Frontend & Backend: AWS EC2 or Lightsail
- Domain: Route 53
- SSL: Let's Encrypt
- Database: PostgreSQL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is private and confidential. All rights reserved. 