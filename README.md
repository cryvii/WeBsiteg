# Seasonal Bunker

A commission management system built with SvelteKit and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or managed)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd seasonal-bunker
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```
   
   ⚠️ **Security Warning:** Never commit your `.env` file! See [Environment Variables Guide](docs/environment-variables.md) for details.

3. **Run database migrations:**
   ```bash
   npx drizzle-kit push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:5173
   ```

## 📚 Documentation

### Quick Start Guides

- **[Quick Start: Managed Hosting](docs/quickstart-managed-hosting.md)** - Deploy to Vercel + Neon in 15 minutes
- **[Quick Start: Self-Hosting](docs/quickstart-self-hosting.md)** - Host from your laptop in 20 minutes

### Detailed Deployment Guides

- **[Managed Hosting (Vercel + Neon)](docs/deployment-managed-hosting.md)** - Complete guide for cloud deployment
- **[Self-Hosting (Cloudflare Tunnel)](docs/deployment-self-hosting.md)** - Complete guide for self-hosting
- **[Deployment Comparison](docs/deployment-comparison.md)** - Compare both approaches
- **[Database Migration Guide](docs/database-migration-guide.md)** - Set up and manage your database
- **[Environment Variables](docs/environment-variables.md)** - Configure your application securely

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run verify-schema` - Verify database schema
- `npm run verify-deployment` - Test deployed application

## 🔒 Security

### Environment Variables

This application uses environment variables for sensitive configuration:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `ORIGIN` - Application origin URL (optional)

**Important Security Notes:**

- ✅ `.env` is already in `.gitignore`
- ✅ Use `.env.example` as a template
- ❌ Never commit `.env` to version control
- ❌ Never share database credentials publicly

See the [Environment Variables Guide](docs/environment-variables.md) for complete documentation.

## 🛠️ Tech Stack

- **Framework:** SvelteKit
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (managed) or Self-hosted

## 📦 Project Structure

```
seasonal-bunker/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   └── server/
│   │       └── db/         # Database schema and connection
│   └── routes/             # SvelteKit routes
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── drizzle/                # Database migrations
├── .env.example            # Environment variables template
└── .env                    # Your local config (not in git)
```

## 🤝 Contributing

When contributing to this project:

1. Never commit `.env` files
2. Update `.env.example` if adding new environment variables
3. Document any new environment variables in `docs/environment-variables.md`
4. Test both locally and in a deployment environment

## 📄 License

[Your License Here]

## 🆘 Getting Help

- Check the [documentation](docs/)
- Review [troubleshooting sections](docs/deployment-managed-hosting.md#troubleshooting)
- Verify your [environment variables](docs/environment-variables.md)

