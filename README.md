# DMU Inventory Management System

Inventory management system for Debre Markos University. Built with React, TypeScript, and Supabase.

## Features

### For All Users
- Role-based access control (Admin, Dean, Department Head, Storekeeper, Staff)
- Real-time notifications
- Audit trail
- Export to Excel
- Responsive design

### For Staff Members
- Submit item requests with approval workflow
- Transfer items to other staff members
- Report maintenance issues
- Track request status
- View assigned items

### For Department Heads
- Approve/reject department requests
- View department inventory
- Manage department staff
- Transfer approvals

### For College Deans
- College-wide oversight
- Approve cross-department requests
- View college inventory
- Monitor transfers

### For Storekeepers
- Final approval and item allocation
- Inventory management
- Multi-item allocation support
- Transfer approvals
- Return request processing

### For Administrators
- User management
- Role assignment
- System configuration
- Audit access

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd DMU_Inventory_management_system
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Setup

Create a \`.env\` file in the root directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Update the \`.env\` file with your Supabase credentials:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Database Setup

Run the migrations in your Supabase project:

\`\`\`bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL files in order from supabase/migrations/
\`\`\`

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:5173\`

## Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── layout/         # Layout components
│   ├── shared/         # Shared components
│   ├── staff/          # Staff-specific components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility libraries
│   ├── constants.ts    # Application constants
│   ├── helpers.ts      # Helper functions
│   ├── config.ts       # Configuration
│   └── logger.ts       # Logging utility
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── dashboards/     # Dashboard pages
│   ├── dean/           # Dean pages
│   ├── department/     # Department head pages
│   ├── staff/          # Staff pages
│   └── storekeeper/    # Storekeeper pages
├── services/           # API service layer
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
\`\`\`

## Configuration

### Feature Flags

Edit \`src/lib/config.ts\` to enable/disable features:

\`\`\`typescript
features: {
  enableNotifications: true,
  enableExport: true,
  enableTransfers: true,
  enableMaintenance: true,
  enableAuditLog: true,
}
\`\`\`

### Pagination Settings

\`\`\`typescript
pagination: {
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
\`\`\`

## UI/UX Guidelines

See `UI_UX_GUIDE.md` for design system documentation:
- Color palette
- Typography
- Component standards
- Accessibility guidelines

## Database Schema

### Main Tables
- \`profiles\` - User profiles and roles
- \`colleges\` - College information
- \`departments\` - Department information
- \`items\` - Inventory items
- \`item_requests\` - Item requests
- \`item_transfers\` - Item transfers
- \`notifications\` - User notifications
- \`item_history\` - Audit trail
- \`maintenance_requests\` - Maintenance tracking

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure database functions
- Input validation and sanitization
- Environment variable protection

## Deployment

### Build for Production

\`\`\`bash
npm run build
\`\`\`

### Deploy to Vercel

\`\`\`bash
vercel deploy
\`\`\`

### Deploy to Netlify

\`\`\`bash
netlify deploy --prod
\`\`\`

## Development Guidelines

### Code Quality
- Use TypeScript
- Follow ESLint rules
- Use constants from `src/lib/constants.ts`
- Implement error boundaries
- Add logging

### Component Development
- Use UI components from `src/components/ui/`
- Follow design system in `UI_UX_GUIDE.md`
- Implement loading and error states
- Add accessibility attributes

### API Calls
- Use API service layer from `src/services/api.ts`
- Use custom hooks from `src/hooks/useDataFetching.ts`
- Handle errors with toast notifications
- Log operations

## Testing

\`\`\`bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
\`\`\`

## Performance

- Database indexes on queried columns
- React Query for data fetching
- Pagination for large datasets
- Optimized bundle size
- Lazy loading for routes

## Troubleshooting

### Common Issues

**Issue: Supabase connection error**
- Check `.env` file has correct credentials
- Verify Supabase project is active

**Issue: Database errors**
- Ensure all migrations are run
- Check RLS policies are enabled

**Issue: Build errors**
- Clear node_modules and reinstall: \`rm -rf node_modules && npm install\`
- Clear build cache: \`rm -rf dist\`

## Additional Documentation

- `IMPLEMENTATION_SUMMARY.md` - Features and implementation
- `UI_UX_GUIDE.md` - Design system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software for Debre Markos University.

## Support

For support, contact the IT department at Debre Markos University.

## Roadmap

- [ ] Mobile app integration
- [ ] Barcode/QR code scanning
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Document attachments
- [ ] Telegram bot integration

---

Built for Debre Markos University
