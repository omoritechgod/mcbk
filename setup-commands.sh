# 1. Update Prisma versions
npm i --save-dev prisma@latest
npm i @prisma/client@latest

# 2. Generate Prisma client
npm run db:generate

# 3. Create tables in database (this is what you were looking for!)
npm run db:push

# 4. Seed database with sample data
npm run db:seed

# 5. Start the server
npm run dev
